import requests
import os
from config import Config

HUGGING_FACE_TOKEN = Config.HUGGING_FACE_TOKEN
class HuggingFaceService:
    def __init__(self):
        self.api_url = "https://api-inference.huggingface.co/models/gpt2"
        self.api_token = HUGGING_FACE_TOKEN

    def get_completion(self, prompt):
        headers = {
            "Authorization": f"Bearer {self.api_token}",
            "Content-Type": "application/json"
        }
        payload = {
            "inputs": prompt
        }
        response = requests.post(self.api_url, headers=headers, json=payload)
        if response.status_code == 200:
            try:
                data = response.json()
                if isinstance(data, list) and len(data) > 0 and "generated_text" in data[0]:
                    return data[0]["generated_text"]
                else:
                    return str(data)
            except Exception as e:
                return f"JSON 파싱 에러: {e}"
        else:
            return f"API 호출 실패: {response.status_code} {response.text}"
