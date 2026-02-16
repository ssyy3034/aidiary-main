import sys
import os

# Add the current directory to sys.path to make imports work
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from services.chat_graph import ChatGraphApp

def test_chat():
    print("Initializing ChatGraphApp...")
    app = ChatGraphApp()

    test_cases = [
        {
            "message": "안녕, 우리 아가! 오늘 엄마는 기분이 참 좋아.",
            "weeks": 12,
            "user_name": "엄마",
            "expected_intent": "casual"
        },
        {
            "message": "임신 중에 초밥 먹어도 되니?",
            "weeks": 20,
            "user_name": "엄마",
            "expected_intent": "medical"
        },
        {
            "message": "오늘 입덧이 너무 심해서 힘들었어. ㅠㅠ",
            "weeks": 8,
            "user_name": "엄마",
            "expected_intent": "casual" # or diary/medical depending on implementation
        }
    ]

    print("\n--- Starting Tests ---")

    for i, test in enumerate(test_cases):
        print(f"\n[Test Case {i+1}] Input: {test['message']}")
        print(f"Context: Weeks={test['weeks']}, Name={test['user_name']}")

        try:
            result = app.invoke({
                "message": test['message'],
                "weeks": test['weeks'],
                "user_name": test['user_name']
            })

            print(f"Intent: {result['intent']}")
            print(f"Response: {result['response']}")
            print("-" * 50)

        except Exception as e:
            print(f"ERROR: {e}")

if __name__ == "__main__":
    test_chat()
