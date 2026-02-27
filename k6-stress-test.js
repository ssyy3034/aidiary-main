import http from 'k6/http';
import { check, sleep } from 'k6';

/**
 * k6 Saturation Test (RabbitMQ Architecture)
 * 목적: 현재 아키텍처의 최대 TPS/RPM 임계점을 찾는다.
 */

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';

export const options = {
    scenarios: {
        saturation_test: {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: [
                { target: 100, duration: '30s' }, // 100 VU
                { target: 300, duration: '1m' },  // 300 VU
                { target: 500, duration: '1m' },  // 500 VU (Saturation Point 탐색)
                { target: 0, duration: '30s' },
            ],
        },
    },
    thresholds: {
        http_req_failed: ['rate<0.01'],
        http_req_duration: ['p(95)<2000'], // 비동기 API는 p95 2초 이내 (보수적 설정)
    },
};

// 테스트용 작은 이미지 (0.5KB 전후)
const TINY_PNG = open('./test-image.png', 'b');

export default function () {
    const formData = {
        parent1: http.file(TINY_PNG, 'parent1.png', 'image/png'),
        parent2: http.file(TINY_PNG, 'parent2.png', 'image/png'),
    };

    // 1. 이미지 분석 요청 (POST)
    // 이 요청이 큐에 쌓이는 속도를 결정함 (Ingress TPS)
    const postRes = http.post(`${BASE_URL}/api/images/analyze`, formData);

    check(postRes, {
        'POST analysis status is 202': (r) => r.status === 202,
    });

    if (postRes.status === 202) {
        const jobId = postRes.json('jobId');

        // 2. 상태 폴링 (최대 부하 유도를 위해 sleep 최소화)
        let polls = 0;
        let done = false;
        while (!done && polls < 3) {
            polls++;
            const statusRes = http.get(`${BASE_URL}/api/images/status/${jobId}`);
            check(statusRes, {
                'GET status is 200': (r) => r.status === 200,
            });

            try {
                const status = statusRes.json('status');
                if (status === 'DONE' || status === 'FAILED') {
                    done = true;
                }
            } catch {}

            if (!done) sleep(0.5); // 폴링 부하 유지
        }
    }

    sleep(0.1); // Iteration 간 최소 지연
}
