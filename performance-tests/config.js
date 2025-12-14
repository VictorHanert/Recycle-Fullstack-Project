import { check } from 'k6';

// Base URL for the API. Override with: k6 run --env BASE_URL=http://backend:8000 performance-tests/stress.js
const rawBaseUrl = __ENV.BASE_URL || 'http://localhost:8000';

// Remove trailing slash to avoid double slashes when building endpoints
export const BASE_URL = rawBaseUrl.replace(/\/$/, '');
// Include trailing slash before query params to avoid 307 redirects from FastAPI
export const PRODUCTS_URL = `${BASE_URL}/api/products/?page=1&size=5`;
export const HEALTH_URL = `${BASE_URL}/health`;

export function ensureOk(response, label = 'status 200') {
  return check(response, { [label]: (r) => r.status === 200 });
}
