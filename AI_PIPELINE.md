# 🧠 AI 감정 분석 & 키워드 추출 파이프라인

## 1. 아키텍처 개요

```
📝 일기 텍스트 (Input)
       │
       ▼
┌──────────────────────────────────────┐
│         Flask Server (Python)        │
│                                      │
│  ┌────────────┐   ┌───────────────┐  │
│  │  Sentiment  │   │   Keyword     │  │
│  │  Analyzer   │   │   Extractor   │  │
│  │ (HF Model)  │   │ (KeyBERT+Kiwi)│  │
│  └──────┬─────┘   └───────┬───────┘  │
│         │                 │          │
│         ▼                 ▼          │
│    ┌─────────────────────────┐       │
│    │    Prompt Generator     │       │
│    │  (감정+키워드 → 프롬프트)  │       │
│    └───────────┬─────────────┘       │
│                │                     │
│                ▼                     │
│    ┌─────────────────────────┐       │
│    │     DALL-E 3 API        │       │
│    │   (이미지 생성, 외부 호출)  │       │
│    └───────────┬─────────────┘       │
│                │                     │
└────────────────┼─────────────────────┘
                 ▼
           🖼️ 그림일기 이미지
```

---

## 2. 사용 모델

### 2-1. 감정 분석 — `cardiffnlp/twitter-xlm-roberta-base-sentiment-multilingual`

| 항목        | 내용                                    |
| :---------- | :-------------------------------------- |
| 모델 크기   | ~1.1GB                                  |
| 아키텍처    | XLM-RoBERTa Base                        |
| 학습 데이터 | 다국어 트윗 (한국어 포함)               |
| 출력        | positive / neutral / negative (3-class) |
| 추론 방식   | Direct classification (1회 추론)        |

**선택 이유:**

- Zero-shot 분류는 라벨당 1회씩 = 8회 추론 → OOM 발생
- Direct classification은 1회 추론으로 메모리 효율적
- 다국어 지원으로 한국어 일기 텍스트에 바로 적용 가능

**감정 매핑:**

```python
SENTIMENT_TO_EMOTION = {
    "positive": "happy",   # 기쁨
    "negative": "sad",     # 슬픔
    "neutral": "calm",     # 평온
}
```

### 2-2. 키워드 추출 — `KeyBERT` + `Kiwi`

| 컴포넌트    | 역할                           | 모델                                             |
| :---------- | :----------------------------- | :----------------------------------------------- |
| **Kiwi**    | 한국어 형태소 분석 (명사 추출) | kiwipiepy (규칙 기반)                            |
| **KeyBERT** | 의미 기반 키워드 랭킹          | `paraphrase-multilingual-MiniLM-L12-v2` (~470MB) |

**추출 흐름:**

```
"오늘 아빠랑 딸기 먹어서 너무 행복했어"
        │
        ▼  Kiwi 형태소 분석
   [아빠(NNG), 딸기(NNG), 행복(NNG)]
        │
        ▼  KeyBERT 중요도 랭킹
   ['행복', '딸기', '아빠']  (top 3)
```

**설계 결정:**

- Kiwi가 먼저 명사 후보를 추출 → KeyBERT가 문맥 중요도로 정렬
- 명사 수 ≤ top_n이면 KeyBERT 생략 (불필요한 연산 방지)
- 1글자 명사(꽃, 물 등)도 포함 (일기 맥락에서 중요)

---

## 3. 검증 결과

### 감정 분석

| 입력 텍스트                             | 분류    | 신뢰도    |
| :-------------------------------------- | :------ | :-------- |
| "오늘 아빠랑 딸기 먹어서 너무 행복했어" | happy   | **98.7%** |
| "아기가 보고 싶어서 눈물이 났어"        | happy\* | 73.5%     |
| "산책하면서 꽃이 예쁘게 피어 있었어"    | happy   | 98.5%     |

> \*"눈물이 났어"가 positive로 분류된 것은 "보고 싶어서"의 긍정적 맥락 때문. 3-class 모델의 한계이나, 그림일기 프롬프트에는 충분함.

### 키워드 추출

| 입력 텍스트                                       | 추출 키워드        |
| :------------------------------------------------ | :----------------- |
| "오늘 아빠랑 딸기 먹어서 너무 행복했어"           | [딸기, 행복, 아빠] |
| "산책하면서 예쁜 꽃을 봤어. 아기도 같이 보았으면" | [산책, 꽃, 아기]   |
| "병원에서 초음파 검사했는데 아기가 건강하대"      | [초음파]           |

---

## 4. API 엔드포인트

### `POST /api/analyze-text` (텍스트 분석만)

```json
// Request
{ "text": "오늘 아빠랑 딸기 먹어서 너무 행복했어" }

// Response
{
  "sentiment": { "label": "happy", "score": 0.987 },
  "keywords": ["행복", "딸기", "아빠"],
  "generated_prompt": "Child's crayon drawing... 행복, 딸기, 아빠..."
}
```

### `POST /api/diary-drawing` (분석 + 이미지 생성)

```json
// Request
{ "diary_text": "오늘 아빠랑 딸기 먹어서 너무 행복했어" }

// Response
{
  "success": true,
  "image_path": "generated_images/generated_image_20260218.png",
  "analysis": { "sentiment": {...}, "keywords": [...] },
  "prompt": "..."
}
```

---

## 5. 모델 선정 과정 (트러블슈팅)

| 시도     | 모델                                 | 문제                        | 해결                           |
| :------- | :----------------------------------- | :-------------------------- | :----------------------------- |
| 1차      | `beomi/KcELECTRA-base`               | 분류 헤드 없음 (base 모델)  | 분류 파이프라인 모델로 전환    |
| 2차      | `xlm-roberta-large-xnli` (zero-shot) | 1.2GB, 다운로드 30분+       | 더 가벼운 모델로 전환          |
| 3차      | `MiniLMv2` (zero-shot)               | 라벨당 1회 추론 = 8회 → OOM | direct classification으로 전환 |
| **최종** | `cardiffnlp` (direct)                | ✅ 1회 추론, 안정적         | —                              |

---

## 6. 파일 구조

```
faceapi/services/
├── sentiment_analyzer.py   # 감정 분석 (cardiffnlp 모델)
├── keyword_extractor.py    # 키워드 추출 (KeyBERT + Kiwi)
├── prompt_generator.py     # DALL-E 프롬프트 생성
└── image_generator.py      # 파이프라인 오케스트레이션 + DALL-E 호출
```
