import http from 'k6/http';
import { sleep } from 'k6';
import { PRODUCTS_URL, HEALTH_URL, ensureOk } from './config.js';

export const options = {
  stages: [
    { duration: '30s', target: 20 },
    { duration: '30s', target: 50 },
    { duration: '30s', target: 100 },
    { duration: '30s', target: 150 },
    { duration: '30s', target: 150 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<4500'], // slight slack; adjust if SLA tightens
  },
};

export function setup() {
  // Wait for backend to be ready (handles cold starts after compose up)
  const maxAttempts = 60;
  for (let i = 0; i < maxAttempts; i += 1) {
    const health = http.get(HEALTH_URL);
    if (health.status === 200) {
      ensureOk(health, 'health 200');
      return;
    }
    sleep(1);
  }
  throw new Error('Backend health check did not become ready within 60s');
}

export default function () {
  const res = http.get(PRODUCTS_URL);
  ensureOk(res, 'products 200');
  sleep(1);
}
