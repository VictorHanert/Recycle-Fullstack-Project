import http from 'k6/http';
import { sleep } from 'k6';
import { PRODUCTS_URL, HEALTH_URL, ensureOk } from './config.js';

// Moderate, steady-state load test
export const options = {
  vus: 50,
  duration: '1m',
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<2000'],
  },
};

export function setup() {
  const health = http.get(HEALTH_URL);
  ensureOk(health, 'health 200');
}

export default function () {
  const res = http.get(PRODUCTS_URL);
  ensureOk(res, 'products 200');
  sleep(1);
}
