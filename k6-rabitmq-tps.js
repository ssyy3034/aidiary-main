import http from 'k6/http';
import { check } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';
const TOKEN = __ENV.TOKEN || '';

export const options = {
  scenarios: {
    tps_test: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { target: 50,  duration: '15s' },
        { target: 200, duration: '30s' },
        { target: 500, duration: '30s' },
        { target: 0,   duration: '15s' },
      ],
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<500'],
  },
};

const TINY_PNG = open('./test-image.png', 'b');

export default function () {
  const formData = {
    parent1: http.file(TINY_PNG, 'parent1.png', 'image/png'),
    parent2: http.file(TINY_PNG, 'parent2.png', 'image/png'),
  };

  const res = http.post(`${BASE_URL}/api/images/analyze`, formData, {
    headers: { 'Authorization': `Bearer ${TOKEN}` },
  });

  check(res, {
    '202 Accepted': (r) => r.status === 202,
  });
}
