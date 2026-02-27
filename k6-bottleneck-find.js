/**
 * k6 병목 탐색 — 3가지 캐시 문제 시나리오 측정
 *
 * 시나리오 A: 고동시 Hot Key  — 같은 데이터(benefits week=20)에 몰리는 상황
 * 시나리오 B: Cache Penetration — 존재하지 않는 week로 반복 요청
 * 시나리오 C: 스파이크 (Cache Avalanche 전제) — 일제 동시 접근
 *
 * 실행: TOKEN=xxx k6 run k6-bottleneck-find.js --out json=result.json
 */
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Counter, Rate } from 'k6/metrics';

const BASE_URL = 'http://localhost:8080';
const TOKEN    = __ENV.TOKEN;

// 시나리오별 메트릭
const mHotKey     = new Trend('hotkey_benefits_duration',    true);
const mPenetrate  = new Trend('penetration_duration',        true);
const mSpike      = new Trend('spike_benefits_duration',     true);
const failRate    = new Rate('fail_rate');

export const options = {
  scenarios: {
    // A: Hot Key — 200 VU가 동일 엔드포인트를 집중 공격
    hot_key: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '10s', target: 100 },
        { duration: '40s', target: 200 },
        { duration: '10s', target: 0   },
      ],
      gracefulRampDown: '5s',
      exec: 'hotKeyScenario',
    },

    // B: Cache Penetration — 존재하지 않는 week 번호로 반복 요청
    cache_penetration: {
      executor: 'constant-vus',
      vus: 50,
      duration: '60s',
      exec: 'penetrationScenario',
      startTime: '0s',
    },

    // C: Spike (Avalanche 전제) — 0→300 급등 후 즉시 종료
    spike: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '5s',  target: 300 },  // 급격한 스파이크
        { duration: '10s', target: 300 },
        { duration: '5s',  target: 0   },
      ],
      gracefulRampDown: '3s',
      exec: 'spikeScenario',
      startTime: '65s',  // A, B 끝난 뒤 실행
    },
  },
};

const headers = { Authorization: `Bearer ${TOKEN}` };

// A: Hot Key — benefits week=20 집중
export function hotKeyScenario() {
  let r = http.get(`${BASE_URL}/api/benefits?week=20`, { headers });
  mHotKey.add(r.timings.duration);
  failRate.add(r.status < 200 || r.status >= 300);
  sleep(0.1);
}

// B: Cache Penetration — week=-1 (존재하지 않는 주차)
export function penetrationScenario() {
  // 존재하지 않는 week: DB는 빈 결과를 반환하지만 매번 쿼리 발생
  let r = http.get(`${BASE_URL}/api/benefits?week=-1`, { headers });
  mPenetrate.add(r.timings.duration);
  failRate.add(r.status >= 500);
  sleep(0.1);
}

// C: Spike — 300 VU 동시 진입 (Cache Avalanche 상황 모사)
export function spikeScenario() {
  let r = http.get(`${BASE_URL}/api/benefits?week=20`, { headers });
  mSpike.add(r.timings.duration);
  failRate.add(r.status < 200 || r.status >= 300);
}
