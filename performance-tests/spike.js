import http from 'k6/http';
import { sleep } from 'k6';
import { PRODUCTS_URL, HEALTH_URL, ensureOk } from './config.js';

// Sudden spike test to observe auto-scaling or throttling behavior
export const options = {
  stages: [
    { duration: '5s', target: 1 },
    { duration: '12s', target: 90 },
    { duration: '30s', target: 90 },
    { duration: '10s', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'],
    // Allow a bit more slack for spike; tighten later if backend improves
    http_req_duration: ['p(95)<6000'],
  },
};

export function setup() {
  const health = http.get(HEALTH_URL);
  ensureOk(health, 'health 200');
}

export default function () {
  const res = http.get(PRODUCTS_URL);
  ensureOk(res, 'products 200');
  sleep(0.5);
}
