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

        # 2. ML 파이프라인 연산
        try:
            generator = get_image_generator()
            result = generator.process_image_generation(p1_path, p2_path)
            
            if not result.get("success"):
                raise ValueError(result.get("error", "Unknown ML failure"))
                
        except ValueError as e:
            # 논리적 인식 오류 (Category 1) -> 실패 Webhook 및 ACK
            logger.warning(f"ML Logical error for {job_id}: {e}")
            send_failure_webhook(job_id, str(e))
            ch.basic_ack(delivery_tag=method.delivery_tag)
            return
        except Exception as e:
            # 시스템 장애/예외 (Category 2) -> 상위 catch에서 NACK 처리 (재시도 유도)
            logger.error(f"System error during ML for {job_id}: {e}")
            raise 

        # 3. Webhook 결과 전송
        try:
            image_path = result.get("image_path")
            send_success_webhook(job_id, image_path)
            logger.info(f"Job {job_id} successfully completed and acknowledged")
            ch.basic_ack(delivery_tag=method.delivery_tag)
        except Exception as e:
            # 네트워크/서버 장애 (Category 3) -> NACK
            logger.error(f"Webhook delivery failed for {job_id}: {e}")
            raise

    except Exception:
        # 모든 비정기적 시스템 예외 상황은 NACK를 통해 DLQ로 메시지 격리 (재시도 대상)
        logger.error(f"Critical failure for {job_id}, signaling NACK/DLQ")
        ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)
    finally:
        cleanup_temp_files(locals().get('p1_path'), locals().get('p2_path'))

def send_success_webhook(job_id, image_path):
    with open(image_path, 'rb') as img_file:
        files = {'image': (os.path.basename(image_path), img_file, 'image/png')}
        data = {'jobId': job_id, 'status': 'SUCCESS'}
        resp = requests.post(WEBHOOK_URL, data=data, files=files, timeout=15)
        resp.raise_for_status()

def cleanup_temp_files(*paths):
    for path in paths:
        if path and os.path.exists(path):
            try:
                os.remove(path)
            except OSError:
                pass

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
