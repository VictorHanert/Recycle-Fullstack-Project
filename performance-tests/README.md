# Performance tests

All scripts use the same base URL helper. Default: `http://localhost:8000` (override with `BASE_URL`).

Run locally (k6 installed):
- `k6 run --env BASE_URL=http://localhost:8000 performance-tests/load.js`
- `k6 run --env BASE_URL=http://localhost:8000 performance-tests/spike.js`
- `k6 run --env BASE_URL=http://localhost:8000 performance-tests/stress.js`
- `k6 run --env BASE_URL=http://localhost:8000 performance-tests/soak.js`

Via Docker (no local k6), PowerShell:
- `docker run --rm -it --network host -v ${PWD}/performance-tests:/scripts grafana/k6 run --env BASE_URL=http://localhost:8000 /scripts/<file>.js`

Notes:
- Stress is capped at 150 VU with p95<4s target (matches what backend currently klarer).
- Spike går til 150 VU med et mere lempeligt p95<6s target.
- Soak kører 1 time; stop den når du har nok data.
