import os
from datetime import datetime
import requests
from openai import OpenAI
from pathlib import Path
import logging
from prompt_generator import generate_prompt  # 기존 함수 import


class ImageGenerator:
    def __init__(self):
        """
        ImageGenerator 초기화
        OpenAI API 키를 환경 변수에서 가져옴
        """
        self.client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
        self.output_dir = Path("generated_images")
        self.output_dir.mkdir(exist_ok=True)

        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s'
        )
        self.logger = logging.getLogger(__name__)

    def generate_image_with_dalle(self, prompt):
        """
        DALL-E를 사용하여 이미지 생성
        """
        try:
            response = self.client.images.generate(
                model="dall-e-3",
                prompt=prompt,
                size="1024x1024",
                quality="standard",
                n=1
            )

            return response.data[0].url

        except Exception as e:
            self.logger.error(f"이미지 생성 중 오류 발생: {str(e)}")
            return None

    def save_image(self, image_url):
        """
        이미지 URL에서 이미지를 다운로드하고 로컬에 저장
        """
        try:
            response = requests.get(image_url)
            response.raise_for_status()

            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            file_path = self.output_dir / f"generated_image_{timestamp}.png"

            with open(file_path, 'wb') as f:
                f.write(response.content)

            self.logger.info(f"이미지가 성공적으로 저장됨: {file_path}")
            return file_path

        except Exception as e:
            self.logger.error(f"이미지 저장 중 오류 발생: {str(e)}")
            return None

    def process_image_generation(self, parent1_features, parent2_features):
        """
        전체 이미지 생성 프로세스 실행
        """
        try:
            # 기존 generate_prompt 함수 사용
            prompt = generate_prompt(parent1_features, parent2_features)
            self.logger.info("프롬프트 생성 완료")

            image_url = self.generate_image_with_dalle(prompt)
            if not image_url:
                return {"success": False, "error": "이미지 생성 실패"}

            saved_path = self.save_image(image_url)
            if not saved_path:
                return {"success": False, "error": "이미지 저장 실패"}

            return {
                "success": True,
                "image_path": str(saved_path),
                "prompt": prompt
            }

        except Exception as e:
            self.logger.error(f"이미지 생성 프로세스 중 오류 발생: {str(e)}")
            return {"success": False, "error": str(e)}