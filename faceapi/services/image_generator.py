import os
import io
import base64
from datetime import datetime
from pathlib import Path
import logging
import cv2

from config import Config


class ImageGenerator:
    def __init__(self):
        """
        ImageGenerator 초기화
        Gemini (gemini-2.0-flash) 사용
        """
        from google import genai
        self.gemini_client = genai.Client(api_key=Config.GEMINI_API_KEY)
        self.output_dir = Path("generated_images")
        self.output_dir.mkdir(exist_ok=True)

        # Lazy loading storage
        self._sentiment_analyzer = None
        self._keyword_extractor = None

        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s'
        )
        self.logger = logging.getLogger(__name__)

    @property
    def sentiment_analyzer(self):
        if self._sentiment_analyzer is None:
            print("[INFO] Lazy loading SentimentAnalyzer...")
            from .sentiment_analyzer import SentimentAnalyzer
            self._sentiment_analyzer = SentimentAnalyzer()
        return self._sentiment_analyzer

    @property
    def keyword_extractor(self):
        if self._keyword_extractor is None:
            print("[INFO] Lazy loading KeywordExtractor...")
            from .keyword_extractor import KeywordExtractor
            self._keyword_extractor = KeywordExtractor()
        return self._keyword_extractor

    def generate_image_with_gemini(self, prompt, reference_image=None):
        """
        Gemini (gemini-2.5-flash-image) API를 사용하여 이미지 생성
        reference_image가 있으면 image-to-image 모드로 동작

        Args:
            prompt: 이미지 생성 프롬프트
            reference_image: 참조 이미지 (BGR numpy array 또는 None)

        Returns:
            bytes: 생성된 이미지 데이터 (PNG) 또는 None
        """
        try:
            from google.genai import types

            enhanced_prompt = (
                f"{prompt}, soft lighting, warm colors, "
                f"high quality portrait photography"
            )

            # 참조 이미지가 있으면 image-to-image
            if reference_image is not None:
                _, buf = cv2.imencode('.png', reference_image)
                img_bytes = buf.tobytes()

                ref_text = (
                    f"This reference image shows the EXACT face shape, eye shape, nose shape, "
                    f"skin tone, and facial proportions the baby should have. "
                    f"Generate a high-quality baby portrait that closely matches these facial features. "
                    f"Specific details: {enhanced_prompt}"
                )
                contents = [
                    types.Part.from_bytes(data=img_bytes, mime_type="image/png"),
                    types.Part.from_text(text=ref_text),
                ]
            else:
                contents = enhanced_prompt

            response = self.gemini_client.models.generate_content(
                model='gemini-2.0-flash',
                contents=contents,
                config=types.GenerateContentConfig(
                    response_modalities=['IMAGE'],
                )
            )

            if response.parts:
                for part in response.parts:
                    if part.inline_data is not None:
                        self.logger.info("Gemini 이미지 생성 성공")
                        return part.inline_data.data

            self.logger.error("Gemini: 생성된 이미지 없음")
        except Exception as e:
            self.logger.error(f"Gemini 이미지 생성 실패: {str(e)}")
            return None

    def generate_scene_description(self, diary_text):
        """
        Gemini를 사용하여 일기 텍스트에서 '그림으로 그릴 만한 장면'을 묘사하는 프롬프트 생성
        """
        try:
            from google.genai import types

            prompt = (
                f"다음 일기를 읽고, 어린 아이가 크레파스로 그릴 법한 핵심 장면을 영어로 묘사해줘. "
                f"주어, 동사, 목적어가 포함된 간결한 문장으로 1~2문장. "
                f"복잡한 추상적 감정보다는 시각적으로 표현 가능한 행동이나 객체 위주로.\n\n"
                f"일기 내용:\n{diary_text}\n\n"
                f"장면 묘사 (영어):"
            )

            response = self.gemini_client.models.generate_content(
                model='gemini-1.5-flash',
                contents=prompt,
                config=types.GenerateContentConfig(
                    temperature=0.7,
                    max_output_tokens=100,
                )
            )

            if response.text:
                description = response.text.strip()
                self.logger.info(f"Gemini 장면 묘사: {description}")
                return description

            return None

        except Exception as e:
            self.logger.error(f"Gemini 장면 묘사 생성 실패: {str(e)}")
            return None

    def save_image(self, image_data):
        """이미지 데이터(bytes)를 파일로 저장"""
        try:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            file_path = self.output_dir / f"generated_image_{timestamp}.png"

            with open(file_path, 'wb') as f:
                f.write(image_data)

            self.logger.info(f"이미지 저장: {file_path}")
            return file_path

        except Exception as e:
            self.logger.error(f"이미지 저장 실패: {str(e)}")
            return None

    def generate_diary_drawing(self, diary_text):
        """일기 텍스트를 분석하여 '태아가 그린 그림일기'를 생성"""
        try:
            sentiment = self.sentiment_analyzer.analyze(diary_text)
            self.logger.info(f"Sentiment: {sentiment}")

            keywords = self.keyword_extractor.extract_keywords(diary_text)
            self.logger.info(f"Keywords: {keywords}")

            # 1. 장면 묘사 생성 (LLM)
            scene_description = self.generate_scene_description(diary_text)

            # 실패 시 키워드 추출로 fallback (선택 사항) 또는 기본값
            if not scene_description:
                self.logger.warning("장면 묘사 실패, 키워드 추출 시도")
                keywords = self.keyword_extractor.extract_keywords(diary_text)
                scene_description = ", ".join(keywords)

            # 2. 프롬프트 생성
            from .prompt_generator import generate_fetal_prompt
            prompt = generate_fetal_prompt(sentiment, scene_description)
            self.logger.info(f"Final Prompt: {prompt}")

            image_data = self.generate_image_with_gemini(prompt)
            if not image_data:
                return {"success": False, "error": "Image generation failed"}

            saved_path = self.save_image(image_data)
            filename = os.path.basename(saved_path)
            web_url = f"/api/images/{filename}"

            return {
                "success": True,
                "image_path": str(saved_path),
                "image_url": web_url,
                "analysis": {"sentiment": sentiment, "keywords": keywords},
                "prompt": prompt,
            }

        except Exception as e:
            self.logger.error(f"Diary drawing failed: {str(e)}")
            return {"success": False, "error": str(e)}

    def process_image_generation(self, parent1_path, parent2_path):
        """
        전체 아이 얼굴 예측 파이프라인 오케스트레이션

        흐름:
          1. face_analyzer로 부모 얼굴 분석 (MediaPipe)
          2. feature_extractor로 유전적 특징 구조화
          3. genetic_blender로 h² 기반 블렌딩
          4. face_morpher로 모핑 참조 이미지 생성
          5. prompt_generator로 상세 프롬프트 생성
          6. Gemini에 [프롬프트 + 모핑 이미지] 전달

        Args:
            parent1_path: 부모1 이미지 파일 경로
            parent2_path: 부모2 이미지 파일 경로

        Returns:
            dict: {"success": bool, "image_path": str, ...}
        """
        try:
            from .face_analyzer import analyze_face
            from .feature_extractor import extract_features
            from .genetic_blender import blend_features
            from .face_morpher import create_morphed_reference
            from .prompt_generator import generate_prompt

            # 1. 부모 얼굴 분석
            self.logger.info("=== 파이프라인 시작 ===")
            p1_data = analyze_face(parent1_path)
            p2_data = analyze_face(parent2_path)

            if "error" in p1_data:
                return {"success": False, "error": f"부모1 분석 실패: {p1_data['error']}"}
            if "error" in p2_data:
                return {"success": False, "error": f"부모2 분석 실패: {p2_data['error']}"}

            self.logger.info("1/6 얼굴 분석 완료")

            # 2. 유전적 특징 구조화
            p1_features = extract_features(p1_data)
            p2_features = extract_features(p2_data)

            if "error" in p1_features:
                return {"success": False, "error": f"부모1 특징 추출 실패: {p1_features['error']}"}
            if "error" in p2_features:
                return {"success": False, "error": f"부모2 특징 추출 실패: {p2_features['error']}"}

            self.logger.info("2/6 특징 구조화 완료")

            # 3. 유전학 기반 블렌딩
            child_features = blend_features(p1_features, p2_features)
            self.logger.info(
                f"3/6 유전적 블렌딩 완료 - "
                f"쌍꺼풀={child_features.get('double_eyelid')}, "
                f"얼굴형={child_features.get('face_shape_category')}, "
                f"코={child_features.get('nose_shape_category')}"
            )

            # 4. 모핑 참조 이미지 생성
            morphed_image = None
            child_landmarks = child_features.get("landmarks", [])
            p1_landmarks = p1_features.get("landmarks", [])
            p2_landmarks = p2_features.get("landmarks", [])

            if child_landmarks and p1_landmarks and p2_landmarks:
                try:
                    morphed_image = create_morphed_reference(
                        parent1_path, parent2_path,
                        p1_landmarks, p2_landmarks, child_landmarks
                    )
                    self.logger.info("4/6 모핑 참조 이미지 생성 완료")
                except Exception as e:
                    self.logger.warning(f"4/6 모핑 스킵 (프롬프트만 사용): {e}")
            else:
                self.logger.info("4/6 랜드마크 부족 → 모핑 스킵")

            # 5. 프롬프트 생성
            prompt = generate_prompt(child_features)
            self.logger.info(f"5/6 프롬프트 생성 완료:\n{prompt}")

            # 6. Gemini로 이미지 생성 (프롬프트 + 참조 이미지)
            image_data = self.generate_image_with_gemini(prompt, morphed_image)

            if not image_data:
                return {"success": False, "error": "이미지 생성 실패"}

            saved_path = self.save_image(image_data)
            if not saved_path:
                return {"success": False, "error": "이미지 저장 실패"}

            filename = os.path.basename(saved_path)
            web_url = f"/api/images/{filename}"

            self.logger.info(f"6/6 파이프라인 완료: {saved_path}")

            return {
                "success": True,
                "image_path": str(saved_path),
                "image_url": web_url,
                "prompt": prompt,
            }

        except Exception as e:
            self.logger.error(f"파이프라인 오류: {str(e)}")
            return {"success": False, "error": str(e)}
