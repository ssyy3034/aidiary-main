import pika
import os
import time
import json
import logging
import base64
import requests
from dotenv import load_dotenv

# .env 파일 로드
load_dotenv()

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("ImageWorker")

# 환경 변수 가공
RABBITMQ_HOST = os.environ.get('RABBITMQ_HOST', 'localhost')
RABBITMQ_PORT = int(os.environ.get('RABBITMQ_PORT', 5672))
RABBITMQ_USER = os.environ.get('RABBITMQ_DEFAULT_USER', 'guest')
RABBITMQ_PASS = os.environ.get('RABBITMQ_DEFAULT_PASS', 'guest')
WEBHOOK_URL = os.environ.get('SPRING_WEBHOOK_URL', 'http://host.docker.internal:8080/api/images/webhook')
SPRING_BASE_URL = WEBHOOK_URL.rsplit('/api/images/webhook', 1)[0]
QUEUE_NAME = 'image-processing'

# Eager load: 시작 시 ML 모델을 미리 로딩하여 첫 요청 콜드 스타트 제거
logger.info("Initializing Heavy ML Models (ImageGenerator)...")
from services.image_generator import ImageGenerator
image_generator = ImageGenerator()
logger.info("ML Models ready.")

def get_image_generator():
    return image_generator

def check_already_processed(job_id):
    """멱등성 가드: Spring Boot에 status를 조회해 이미 완료된 작업인지 확인."""
    try:
        resp = requests.get(f"{SPRING_BASE_URL}/api/images/status/{job_id}", timeout=3)
        if resp.status_code == 200:
            return resp.json().get('status') in ('DONE', 'FAILED')
    except Exception as e:
        logger.warning(f"[Idempotency] Status check failed for {job_id}: {e}")
    return False

def process_message(ch, method, properties, body):
    job_id = "UNKNOWN"
    try:
        # 1. 메시지 파싱
        # Spring Boot의 Jackson2JsonMessageConverter가 전송한 JSON 파싱
        message_data = json.loads(body.decode('utf-8'))
        job_id = message_data.get('jobId')

        logger.info(f"Received Job: {job_id}")

        # 멱등성 가드: RabbitMQ at-least-once delivery로 인한 중복 처리 방지 (~30초 연산 낭비 차단)
        if check_already_processed(job_id):
            logger.info(f"[Idempotency] Job {job_id} already processed. ACK and skip.")
            ch.basic_ack(delivery_tag=method.delivery_tag)
            return

        # Base64 인코딩된 파일 바이트 디코딩 임시 저장 파일로 변환
        parent1_bytes = base64.b64decode(message_data.get('parent1Bytes'))
        parent2_bytes = base64.b64decode(message_data.get('parent2Bytes'))
        parent1_name = message_data.get('parent1Name', 'parent1.jpg')
        parent2_name = message_data.get('parent2Name', 'parent2.jpg')

        # 임시 작업 폴더 생성
        os.makedirs('/tmp/faceapi_jobs', exist_ok=True)
        p1_path = f"/tmp/faceapi_jobs/{job_id}_{parent1_name}"
        p2_path = f"/tmp/faceapi_jobs/{job_id}_{parent2_name}"

        with open(p1_path, 'wb') as f:
            f.write(parent1_bytes)
        with open(p2_path, 'wb') as f:
            f.write(parent2_bytes)

        # 2. ML 파이프라인 연산 (ImageGenerator 활용)
        generator = get_image_generator()
        result = generator.process_image_generation(p1_path, p2_path)

        # 3. Webhook으로 백엔드(Spring Boot)에 결과 리턴
        if result.get("success"):
            logger.info(f"Job {job_id} ML done, sending webhook")
            image_path = result.get("image_path")

            with open(image_path, 'rb') as img_file:
                files = {'image': (os.path.basename(image_path), img_file, 'image/png')}
                data = {'jobId': job_id, 'status': 'SUCCESS'}
                resp = requests.post(WEBHOOK_URL, data=data, files=files)

            if resp.status_code == 200:
                logger.info(f"Webhook sent for {job_id}")
            else:
                logger.error(f"Webhook failed {resp.status_code}: {resp.text}")
        else:
            logger.error(f"ML failed for {job_id}: {result.get('error')}")
            send_failure_webhook(job_id, result.get("error"))

    except Exception as e:
        logger.error(f"Worker error on {job_id}: {str(e)}")
        send_failure_webhook(job_id, str(e))
    finally:
        # 메시지 처리 완료 ACK 전송
        logger.info(f"ACK {job_id}")
        ch.basic_ack(delivery_tag=method.delivery_tag)

        for path in [locals().get('p1_path'), locals().get('p2_path')]:
            if path and os.path.exists(path):
                os.remove(path)

def send_failure_webhook(job_id, error_msg):
    try:
        data = {'jobId': job_id, 'status': 'FAILED', 'error': error_msg}
        requests.post(WEBHOOK_URL, data=data)
    except Exception as e:
        logger.error(f"Failed to send failure webhook for {job_id}: {e}")

def main():
    logger.info("Starting image worker...")

    # RabbitMQ가 완전히 뜰 때까지 대기
    connection = None
    retry_count = 0
    while connection is None and retry_count < 10:
        try:
            credentials = pika.PlainCredentials(RABBITMQ_USER, RABBITMQ_PASS)
            parameters = pika.ConnectionParameters(
                host=RABBITMQ_HOST,
                port=RABBITMQ_PORT,
                credentials=credentials,
                # Heartbeat 처리를 길게 두어 무거운 ML 작업 도중 끊기지 않도록 방지
                heartbeat=600,
                blocked_connection_timeout=300
            )
            connection = pika.BlockingConnection(parameters)
        except pika.exceptions.AMQPConnectionError:
            logger.warning(f"RabbitMQ not ready. Retrying in 5 seconds... ({retry_count}/10)")
            retry_count += 1
            time.sleep(5)

    if not connection:
        logger.error("Failed to connect to RabbitMQ")
        return

    channel = connection.channel()

    # 큐가 존재하도록 강제 (durable=True)
    channel.queue_declare(queue=QUEUE_NAME, durable=True, arguments={
        'x-dead-letter-exchange': 'image-exchange.dlx',
        'x-dead-letter-routing-key': 'image-processing.dlq'
    })

    # 공정 분배: 한 워커당 한 번에 1개의 메시지만 가져감
    channel.basic_qos(prefetch_count=1)

    # 콜백 등록 (auto_ack=False 로 설정해 수동 성공 처리)
    channel.basic_consume(queue=QUEUE_NAME, on_message_callback=process_message, auto_ack=False)

    logger.info(f"Consuming from '{QUEUE_NAME}'")
    try:
        channel.start_consuming()
    except KeyboardInterrupt:
        logger.info("Stopping Worker...")
        channel.stop_consuming()
    finally:
        connection.close()

if __name__ == '__main__':
    main()
