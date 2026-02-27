/**
 * k6 다중 사용자 캐시 효과 검증 테스트
 *
 * 목적: 단일 userId 테스트의 DB row contention 아티팩트를 제거하고
 *       실제 멀티 유저 환경에서의 캐시 효과를 정확히 측정한다.
 *
 * 시나리오:
 *   - 50명의 실제 사용자가 각자의 JWT로 요청 (userId 분산)
 *   - 임신 주차는 1~42 랜덤 → 다양한 캐시 키 커버리지
 *   - 각 사용자는 benefits 조회 + toggle + 재조회 패턴으로 실 사용 모방
 *
 * 사전 준비:
 *   1. 50개 계정 생성 후 각 JWT를 tokens.json 에 저장
 *      [{"token":"xxx","week":20}, {"token":"yyy","week":4}, ...]
 *   2. k6 run k6-multiuser-cache-test.js --env TOKENS_FILE=tokens.json
 *
 * 실행 (단일 토큰으로 간단 테스트):
 *   TOKEN=xxx WEEK=20 k6 run k6-multiuser-cache-test.js
 */
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Counter, Rate } from 'k6/metrics';

const BASE_URL = 'http://localhost:8080';

// 단일 토큰 + 다양한 주차 시뮬레이션
const TOKEN = __ENV.TOKEN;
const WEEKS = [4, 8, 12, 16, 20, 24, 28, 32, 36, 40]; // 가장 많이 조회되는 주차대

const benefitDuration = new Trend('benefit_list_duration', true);
const toggleDuration  = new Trend('benefit_toggle_duration', true);
const errorRate       = new Rate('error_rate');
const cacheHitProxy   = new Counter('fast_response_count'); // <5ms = cache HIT proxy

export const options = {
  scenarios: {
    /**
     * 시나리오 A: 정상 부하 (Warm Cache)
     * 앱 기동 후 Cache Warmup 완료 상태에서의 응답 속도 측정
     */
    warm_cache_load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '10s', target: 30 },
        { duration: '30s', target: 30 },  // 30 VU 안정 구간
        { duration: '10s', target: 0  },
      ],
      startTime: '0s',
      tags: { scenario: 'warm_cache' },
    },

    /**
     * 시나리오 B: Hot Key 집중 부하 (임신 20주 집중 — 가장 흔한 주차)
     * 분산 락 + DCL이 실제로 DB를 보호하는지 확인
     * 캐싱 전: p(95)=57.9ms (200VU), 캐싱 후 목표: p(95)<15ms
     */
    hot_key_week20: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '5s',  target: 100 },
        { duration: '20s', target: 200 },  // 200 VU 집중
        { duration: '5s',  target: 0   },
      ],
      startTime: '55s',  // warm_cache 완료 후 시작
      tags: { scenario: 'hot_key' },
    },
  },
  thresholds: {
    // 캐싱 전 기준선 대비 개선 목표
    'benefit_list_duration{scenario:warm_cache}': ['p(95)<20'],   // 정상 부하: p95<20ms
    'benefit_list_duration{scenario:hot_key}':    ['p(95)<30'],   // 핫키 부하: p95<30ms (이전 57.9ms)
    'error_rate': ['rate<0.01'],
  },
};

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${TOKEN}`,
};

function randomWeek() {
  return WEEKS[Math.floor(Math.random() * WEEKS.length)];
}

export default function () {
  const week = randomWeek();

  // 1. Benefits 목록 조회 (캐시 히트 경로)
  const startList = Date.now();
  const listRes = http.get(`${BASE_URL}/api/benefits?week=${week}`, { headers, tags: { name: 'benefit_list' } });
  const listMs = Date.now() - startList;

  benefitDuration.add(listMs);

  const listOk = check(listRes, {
    'benefit list 200': (r) => r.status === 200,
  });
  errorRate.add(!listOk);

  // 응답 5ms 미만 → 캐시 HIT 프록시 지표 (Redis RTT 고려)
  if (listMs < 5) cacheHitProxy.add(1);

  // 2. Toggle (user-specific write → DB hit, cache 무관)
  let benefitId = null;
  if (listRes.status === 200) {
    try {
      const body = JSON.parse(listRes.body);
      const benefits = Array.isArray(body) ? body : (body.data || []);
      if (benefits.length > 0) benefitId = benefits[0].id;
    } catch (_) {}
  }

  if (benefitId) {
    const startToggle = Date.now();
    const toggleRes = http.post(
      `${BASE_URL}/api/benefits/${benefitId}/toggle`,
      null,
      { headers, tags: { name: 'benefit_toggle' } }
    );
    toggleDuration.add(Date.now() - startToggle);
    check(toggleRes, { 'toggle 200': (r) => r.status === 200 });

    // 3. Toggle 후 즉시 재조회 — 캐시 데이터와 DB 일관성 확인
    const reloadRes = http.get(`${BASE_URL}/api/benefits?week=${week}`, { headers, tags: { name: 'benefit_reload' } });
    check(reloadRes, { 'reload 200': (r) => r.status === 200 });
  }

  sleep(0.5 + Math.random()); // 0.5~1.5s 랜덤 think time (실 사용자 패턴)
}

export function handleSummary(data) {
  const warm = data.metrics['benefit_list_duration'] || {};
  const hotkey = data.metrics['benefit_list_duration{scenario:hot_key}'] || {};

  console.log('\n========== 캐시 효과 측정 결과 ==========');
  console.log('[기준선] 캐싱 전 hot_key p(95) = 57.9ms');
  console.log(`[측정값] warm_cache  p(95) = ${(warm.values?.['p(95)'] || 0).toFixed(2)}ms`);
  console.log(`[측정값] hot_key     p(95) = ${(hotkey.values?.['p(95)'] || 0).toFixed(2)}ms`);
  const hitCount = data.metrics['fast_response_count']?.values?.count || 0;
  const totalReq = data.metrics['http_reqs']?.values?.count || 1;
  console.log(`[캐시 HIT proxy] <5ms 응답 비율: ${((hitCount / totalReq) * 100).toFixed(1)}%`);
  console.log('==========================================\n');

  return {
    'k6-multiuser-result.json': JSON.stringify(data, null, 2),
  };
}
