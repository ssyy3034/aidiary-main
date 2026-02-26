#!/bin/bash
# k6-heap-monitor.sh: Actuator 힙 메트릭을 1초 간격으로 수집
# 사용법: bash k6-heap-monitor.sh [BASE_URL] [DURATION_SECONDS]

BASE_URL=${1:-"http://localhost:8080"}
DURATION=${2:-60}
OUTPUT_FILE="heap-metrics-$(date +%Y%m%d-%H%M%S).csv"

echo "📊 힙 메모리 모니터링 시작"
echo "   대상: ${BASE_URL}/actuator/metrics/jvm.memory.used"
echo "   기간: ${DURATION}초"
echo "   출력: ${OUTPUT_FILE}"
echo ""

echo "timestamp,heap_used_mb,non_heap_used_mb" > "$OUTPUT_FILE"

for i in $(seq 1 $DURATION); do
  HEAP=$(curl -s "${BASE_URL}/actuator/metrics/jvm.memory.used?tag=area:heap" \
    | python3 -c "import sys,json; print(json.load(sys.stdin)['measurements'][0]['value'])" 2>/dev/null)

  NON_HEAP=$(curl -s "${BASE_URL}/actuator/metrics/jvm.memory.used?tag=area:nonheap" \
    | python3 -c "import sys,json; print(json.load(sys.stdin)['measurements'][0]['value'])" 2>/dev/null)

  if [ -n "$HEAP" ]; then
    HEAP_MB=$(echo "scale=2; $HEAP / 1024 / 1024" | bc)
    NON_HEAP_MB=$(echo "scale=2; $NON_HEAP / 1024 / 1024" | bc)
    TIMESTAMP=$(date +%H:%M:%S)

    echo "${TIMESTAMP},${HEAP_MB},${NON_HEAP_MB}" >> "$OUTPUT_FILE"
    printf "\r  [%3ds/%ds] Heap: %s MB" "$i" "$DURATION" "$HEAP_MB"
  else
    printf "\r  [%3ds/%ds] ⚠️ 응답 없음" "$i" "$DURATION"
  fi

  sleep 1
done

echo ""
echo ""
echo "📁 결과 저장됨: ${OUTPUT_FILE}"
echo ""

# 요약
FIRST_HEAP=$(head -2 "$OUTPUT_FILE" | tail -1 | cut -d',' -f2)
LAST_HEAP=$(tail -1 "$OUTPUT_FILE" | cut -d',' -f2)
echo "📊 힙 변화 요약:"
echo "   시작: ${FIRST_HEAP} MB"
echo "   종료: ${LAST_HEAP} MB"
echo "   변화: $(echo "scale=2; $LAST_HEAP - $FIRST_HEAP" | bc) MB"
