import http from 'k6/http';
import { check, sleep } from 'k6';

/**
 * k6 Queue Overflow 테스트
 *
 * 목표: ThreadPoolTaskExecutor의 한계(maxPool=10, queue=25)를
 *       초과하는 동시 요청을 보내 CallerRunsPolicy 동작을 확인한다.
 *
 * 동시 40 VU → 35(pool+queue) 초과 → CallerRunsPolicy 발동
 * → Tomcat 스레드가 직접 Flask 호출 → 응답 지연 증가 관측
 */

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';
const USERNAME = __ENV.USERNAME || 'testuser';
const PASSWORD = __ENV.PASSWORD || 'testpass';

export const options = {
  scenarios: {
    burst: {
      executor: 'constant-vus',
      vus: 40,          // 35(pool+queue) 초과
      duration: '15s',
    },
  },
};

const TINY_PNG = open('./test-image.png', 'b');

export function setup() {
  // 로그인
  const loginRes = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify({
    username: USERNAME,
    password: PASSWORD,
  }), { headers: { 'Content-Type': 'application/json' } });

  const token = loginRes.json('token') || '';

  // 초기 힙
  const heapRes = http.get(`${BASE_URL}/actuator/metrics/jvm.memory.used?tag=area:heap`);
  const initialHeap = heapRes.json('measurements.0.value') || 0;
  console.log(`📊 초기 힙: ${(initialHeap / 1024 / 1024).toFixed(2)} MB`);

  // 초기 active thread 수
  const threadRes = http.get(`${BASE_URL}/actuator/metrics/executor.pool.size?tag=name:imageTaskExecutor`);
  const poolSize = threadRes.json('measurements.0.value') || 'N/A';
  console.log(`🧵 초기 Pool Size: ${poolSize}`);

  return { token, initialHeap };
}

export default function (data) {
  const headers = {
    'Authorization': `Bearer ${data.token}`,
  };

  const formData = {
    parent1: http.file(TINY_PNG, 'parent1.png', 'image/png'),
    parent2: http.file(TINY_PNG, 'parent2.png', 'image/png'),
  };

  // 이미지 분석 제출
  const submitRes = http.post(`${BASE_URL}/api/images/analyze`, formData, {
    headers,
    timeout: '30s',
  });

  const submitted = check(submitRes, {
    'Job 제출 성공': (r) => r.status === 202 || r.status === 200,
  });

  if (!submitted) {
    check(submitRes, {
      '429 Too Many Requests': (r) => r.status === 429,
      '503 Service Unavailable': (r) => r.status === 503,
      'CallerRuns 지연 (status 200/202 but slow)': (r) => r.timings.duration > 1000,
    });
    return;
  }

  // 폴링 (짧게)
  const jobId = submitRes.json('jobId');
  if (jobId) {
    sleep(2);
    http.get(`${BASE_URL}/api/images/status/${jobId}`, { headers });
  }
}

export function teardown(data) {
  sleep(2);

  const heapRes = http.get(`${BASE_URL}/actuator/metrics/jvm.memory.used?tag=area:heap`);
  const finalHeap = heapRes.json('measurements.0.value') || 0;

  console.log('');
  console.log('='.repeat(55));
  console.log('📊 Queue Overflow 테스트 결과');
  console.log('='.repeat(55));
  console.log(`  초기 힙: ${(data.initialHeap / 1024 / 1024).toFixed(2)} MB`);
  console.log(`  최종 힙: ${(finalHeap / 1024 / 1024).toFixed(2)} MB`);
  console.log('');
  console.log('  📌 CallerRunsPolicy 동작 시:');
  console.log('     - 요청은 거부되지 않음 (202 반환)');
  console.log('     - 대신 Tomcat 스레드가 직접 처리 → 응답 지연 증가');
  console.log('     - http_req_duration p(95) 값 확인 필요');
  console.log('='.repeat(55));
}
