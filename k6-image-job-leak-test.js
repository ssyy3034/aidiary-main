import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';

/**
 * k6 부하 테스트: ImageJobStore 메모리 누수 재현
 *
 * 시나리오: 동시 사용자가 이미지 분석 요청 → Job 생성 → Map에 누적
 * 목표: 요청 완료 후에도 힙이 반환되지 않는 문제 확인
 */

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';
const USERNAME = __ENV.USERNAME || 'testuser';
const PASSWORD = __ENV.PASSWORD || 'testpass';

export const options = {
  scenarios: {
    image_jobs: {
      executor: 'constant-vus',
      vus: 5,
      duration: '30s',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<10000'],
  },
};

// 1x1 PNG 바이트 (테스트용 최소 이미지)
const TINY_PNG = open('./test-image.png', 'b') || createMinimalPng();

function createMinimalPng() {
  // 바이너리 데이터는 open()으로 읽어야 함. 없으면 빈 바이너리.
  return new Uint8Array([]).buffer;
}

/**
 * 테스트 전: 힙 메모리 기록
 */
export function setup() {
  // 로그인
  const loginRes = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify({
    username: USERNAME,
    password: PASSWORD,
  }), { headers: { 'Content-Type': 'application/json' } });

  const token = loginRes.json('token') || '';
  if (!token) {
    console.warn('⚠️ 로그인 실패 — 인증 없이 진행합니다');
  }

  // 초기 힙 상태 기록
  const heapRes = http.get(`${BASE_URL}/actuator/metrics/jvm.memory.used?tag=area:heap`);
  const initialHeap = heapRes.json('measurements.0.value') || 0;
  console.log(`📊 초기 힙 사용량: ${(initialHeap / 1024 / 1024).toFixed(2)} MB`);

  return { token, initialHeap };
}

/**
 * 메인 테스트: 이미지 분석 Job 생성 (Map에 누적됨)
 */
export default function (data) {
  const headers = {
    'Authorization': `Bearer ${data.token}`,
  };

  // 이미지 분석 요청 제출
  const formData = {
    parent1: http.file(TINY_PNG, 'parent1.png', 'image/png'),
    parent2: http.file(TINY_PNG, 'parent2.png', 'image/png'),
  };

  const submitRes = http.post(`${BASE_URL}/api/images/analyze`, formData, { headers });

  const submitted = check(submitRes, {
    'Job 제출 성공 (202)': (r) => r.status === 202 || r.status === 200,
    'jobId 반환됨': (r) => {
      try { return !!r.json('jobId'); } catch { return false; }
    },
  });

  if (!submitted) {
    console.warn(`❌ Job 제출 실패: ${submitRes.status} ${submitRes.body}`);
    sleep(1);
    return;
  }

  const jobId = submitRes.json('jobId');

  // 폴링 (최대 10회)
  let done = false;
  let polls = 0;
  while (!done && polls < 10) {
    sleep(2);
    polls++;
    const statusRes = http.get(`${BASE_URL}/api/images/status/${jobId}`, { headers });
    const status = statusRes.json('status');

    if (status === 'DONE' || status === 'FAILED') {
      done = true;

      // 결과 조회 (byte[]를 Map에서 읽음)
      if (status === 'DONE') {
        http.get(`${BASE_URL}/api/images/result/${jobId}`, { headers });
      }
    }
  }

  sleep(1);
}

/**
 * 테스트 후: 힙 메모리 비교
 */
export function teardown(data) {
  // GC 유도를 위한 대기
  sleep(3);

  const heapRes = http.get(`${BASE_URL}/actuator/metrics/jvm.memory.used?tag=area:heap`);
  const finalHeap = heapRes.json('measurements.0.value') || 0;
  const diff = finalHeap - data.initialHeap;

  console.log('');
  console.log('='.repeat(50));
  console.log('📊 메모리 누수 분석 결과');
  console.log('='.repeat(50));
  console.log(`  초기 힙: ${(data.initialHeap / 1024 / 1024).toFixed(2)} MB`);
  console.log(`  최종 힙: ${(finalHeap / 1024 / 1024).toFixed(2)} MB`);
  console.log(`  차이:    ${(diff / 1024 / 1024).toFixed(2)} MB`);
  console.log('');
  if (diff > 5 * 1024 * 1024) {
    console.log('🚨 메모리 누수 의심! 힙이 5MB 이상 증가했습니다.');
    console.log('   원인: ImageJobStore의 ConcurrentHashMap에 완료된 Job이 해제되지 않음');
  } else {
    console.log('✅ 힙 사용량이 안정적입니다.');
  }
  console.log('='.repeat(50));
}
