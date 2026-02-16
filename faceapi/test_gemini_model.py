import os
import sys
# Add project root to path
sys.path.append(os.path.abspath("/Users/dongha/jungle/aidiary-main/faceapi"))

from config import Config
from google import genai
from google.genai import types

def test_gemini_flash():
    api_key = Config.GEMINI_API_KEY
    if not api_key:
        print("ERROR: GEMINI_API_KEY is missing.")
        return

    client = genai.Client(api_key=api_key)

    print("Testing gemini-2.0-flash...")
    try:
        response = client.models.generate_content(
            model='gemini-2.0-flash',
            contents="Hello, are you there?",
            config=types.GenerateContentConfig(
                max_output_tokens=50,
            )
        )
        print(f"SUCCESS: {response.text}")
    except Exception as e:
        print(f"FAILURE: {e}")

    print("\nTesting gemini-1.5-flash (fallback check)...")
    try:
        response = client.models.generate_content(
            model='gemini-1.5-flash',
            contents="Hello, are you there?",
            config=types.GenerateContentConfig(
                max_output_tokens=50,
            )
        )
        print(f"SUCCESS: {response.text}")
    except Exception as e:
        print(f"FAILURE: {e}")

if __name__ == "__main__":
    test_gemini_flash()
