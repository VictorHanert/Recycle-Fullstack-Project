# Start everything
docker-compose up

# Or start just frontend + backend (without databases if they're already running)
docker-compose up frontend backend

# Stop everything
docker-compose down


# Check:
Access your frontend: http://localhost:5173
Access your backend API: http://localhost:8000
Check backend health: http://localhost:8000/health
Test API endpoint: http://localhost:8000/api/test