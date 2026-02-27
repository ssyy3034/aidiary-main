/**
 * k6 Cache Benchmark — 엔드포인트별 부하 하 응답 시간 측정
 *
 * 목적: 캐싱 적용 전 병목 지점 정량화
 * 실행: TOKEN=xxx k6 run k6-cache-benchmark.js
 */
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Counter } from 'k6/metrics';

const BASE_URL = 'http://localhost:8080';
const TOKEN = __ENV.TOKEN;

// 엔드포인트별 커스텀 메트릭
const pregnancyDuration  = new Trend('duration_pregnancy_current',  true);
const benefitsDuration   = new Trend('duration_benefits_week',      true);
const diaryDuration      = new Trend('duration_diary_list',         true);
const healthDuration     = new Trend('duration_health_history',     true);
const fetalDuration      = new Trend('duration_fetal_today',        true);
const failCounter        = new Counter('failed_requests');

export const options = {
  scenarios: {
    // 시나리오 1: 실사용 패턴 (헬스탭 오픈) — 중강도 지속
    realistic_load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 30  },   // ramp-up
        { duration: '60s', target: 30  },   // sustained
        { duration: '10s', target: 0   },   // ramp-down
      ],
      gracefulRampDown: '5s',
    },
  },
  thresholds: {
    // 병목 기준선 (캐싱 전)
    'duration_pregnancy_current': ['p(95)<300'],
    'duration_benefits_week':     ['p(95)<500'],
    'duration_diary_list':        ['p(95)<500'],
    'duration_health_history':    ['p(95)<300'],
    'duration_fetal_today':       ['p(95)<300'],
    http_req_failed: ['rate<0.01'],
  },
};

const headers = {
  Authorization: `Bearer ${TOKEN}`,
  'Content-Type': 'application/json',
};

export default function () {
  // 1. 임신 주차 정보 (헬스탭 진입 시 항상 호출)
  let r1 = http.get(`${BASE_URL}/api/pregnancy/current`, { headers });
  pregnancyDuration.add(r1.timings.duration);
  if (!check(r1, { 'pregnancy 2xx': (r) => r.status >= 200 && r.status < 300 })) failCounter.add(1);

  // 2. 복지혜택 목록 (20주차 기준)
  let r2 = http.get(`${BASE_URL}/api/benefits?week=20`, { headers });
  benefitsDuration.add(r2.timings.duration);
  if (!check(r2, { 'benefits 2xx': (r) => r.status >= 200 && r.status < 300 })) failCounter.add(1);

  // 3. 일기 목록 첫 페이지
  let r3 = http.get(`${BASE_URL}/api/diary?page=0&size=10`, { headers });
  diaryDuration.add(r3.timings.duration);
  if (!check(r3, { 'diary 2xx': (r) => r.status >= 200 && r.status < 300 })) failCounter.add(1);

  // 4. 건강 지표 히스토리
  let r4 = http.get(`${BASE_URL}/api/health/history`, { headers });
  healthDuration.add(r4.timings.duration);
  if (!check(r4, { 'health 2xx': (r) => r.status >= 200 && r.status < 300 })) failCounter.add(1);

  // 5. 오늘 태동 요약
  let r5 = http.get(`${BASE_URL}/api/fetal-movement/today`, { headers });
  fetalDuration.add(r5.timings.duration);
  if (!check(r5, { 'fetal 2xx': (r) => r.status >= 200 && r.status < 300 })) failCounter.add(1);

  sleep(0.5);  // 사용자 탭 전환 간격 시뮬레이션
}
