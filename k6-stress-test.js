import http from 'k6/http';
import { check, sleep } from 'k6';

/**
 * k6 Ramping Stress Test
 *
 * 목표: 점진적으로 VU를 증가시켜 현재 @Async + ThreadPool 아키텍처의
 *       임계점을 찾는다. Grafana에서 실시간 모니터링하며 실행.
 *
 * 단계: 10 → 20 → 40 → 80 → 120 VU (각 30초)
 *
 * 관측 대상 (Grafana 대시보드):
 *   1. Tomcat busy threads → max(200)에 도달하는 시점
 *   2. imageTaskExecutor queued tasks → 25 초과 시점
 *   3. HTTP p95 응답시간 → 급격히 증가하는 시점
 *   4. JVM heap → 안정성 확인
 */

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';

export const options = {
  scenarios: {
    ramping_load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { target: 10, duration: '10s' },   // 웜업
        { target: 10, duration: '30s' },   // Stage 1: 10 VU (기본 부하)
        { target: 20, duration: '10s' },   // 전환
        { target: 20, duration: '30s' },   // Stage 2: 20 VU
        { target: 40, duration: '10s' },   // 전환
        { target: 40, duration: '30s' },   // Stage 3: 40 VU (Pool+Queue 초과 시작)
        { target: 80, duration: '10s' },   // 전환
        { target: 80, duration: '30s' },   // Stage 4: 80 VU (CallerRuns 부하)
        { target: 120, duration: '10s' },  // 전환
        { target: 120, duration: '30s' },  // Stage 5: 120 VU (Tomcat 스레드 압박)
        { target: 0, duration: '10s' },    // 쿨다운
      ],
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<30000'],
    'http_req_duration{stage:1}': ['p(95)<5000'],
    'http_req_duration{stage:5}': ['p(95)<60000'],
  },
};

const TINY_PNG = open('./test-image.png', 'b');

export function setup() {
  // 초기 메트릭 기록
  const heapRes = http.get(`${BASE_URL}/actuator/metrics/jvm.memory.used?tag=area:heap`);
  const initialHeap = heapRes.json('measurements.0.value') || 0;
  console.log('');
  console.log('='.repeat(55));
  console.log('🚀 Ramping Stress Test 시작');
  console.log('='.repeat(55));
  console.log(`  초기 힙: ${(initialHeap / 1024 / 1024).toFixed(2)} MB`);
  console.log(`  단계: 10 → 20 → 40 → 80 → 120 VU`);
  console.log(`  총 시간: ~3분 30초`);
  console.log('');
  console.log('📊 Grafana에서 실시간 확인:');
  console.log('   http://<EC2-IP>:3000 (admin/admin)');
  console.log('='.repeat(55));

  return { initialHeap };
}

export default function () {
  const formData = {
    parent1: http.file(TINY_PNG, 'parent1.png', 'image/png'),
    parent2: http.file(TINY_PNG, 'parent2.png', 'image/png'),
  };

  // 이미지 분석 제출
  const submitRes = http.post(`${BASE_URL}/api/images/analyze`, formData, {
    timeout: '60s',
  });

  check(submitRes, {
    'Job 제출 성공': (r) => r.status === 202 || r.status === 200,
  });

  // 폴링 (최대 5회)
  if (submitRes.status === 202 || submitRes.status === 200) {
    let jobId;
    try { jobId = submitRes.json('jobId'); } catch {}

    if (jobId) {
      let polls = 0;
      let done = false;
      while (!done && polls < 5) {
        sleep(2);
        polls++;
        const statusRes = http.get(`${BASE_URL}/api/images/status/${jobId}`);
        try {
          const status = statusRes.json('status');
          if (status === 'DONE' || status === 'FAILED') {
            done = true;
          }
        } catch {}
      }
    }
  }

  sleep(0.5);
}

export function teardown(data) {
  sleep(3);

  const heapRes = http.get(`${BASE_URL}/actuator/metrics/jvm.memory.used?tag=area:heap`);
  const finalHeap = heapRes.json('measurements.0.value') || 0;

  console.log('');
  console.log('='.repeat(55));
  console.log('📊 Stress Test 결과');
  console.log('='.repeat(55));
  console.log(`  초기 힙: ${(data.initialHeap / 1024 / 1024).toFixed(2)} MB`);
  console.log(`  최종 힙: ${(finalHeap / 1024 / 1024).toFixed(2)} MB`);
  console.log('');
  console.log('  📌 Grafana 대시보드에서 다음을 확인하세요:');
  console.log('     1. Tomcat busy threads가 max(200)에 도달했는가?');
  console.log('     2. imageTaskExecutor queue가 25를 초과했는가?');
  console.log('     3. HTTP p95 응답시간이 급격히 증가한 시점은?');
  console.log('     4. GC pause가 눈에 띄게 증가했는가?');
  console.log('='.repeat(55));
}
