# Fullstack Project
## Tech Stack

### Frontend
- **React** with Vite
- **React Router** for navigation
- **Tailwind CSS and MUI** for styling
- **Context API** for state management

### Backend
- **Python** with FastAPI
- **SQLAlchemy** ORM
- **Pydantic** for data validation
- **JWT** authentication
- **CORS** middleware

### Databases
- **MySQL** (primary database)
- **MongoDB** (document store)
- **Neo4j** (graph database)

### Testing
- **Jest** for frontend testing
- **Pytest** for backend testing

### Development & Deployment
- **Docker** & Docker Compose
- **Poetry** for Python dependency management
- **ESLint** for code linting

## Getting Started

### Start the Application

```bash
# Start whole platform (frontend, backend, and databases)
docker-compose up

# Start only frontend and backend (if databases are already running)
docker-compose up frontend backend

# Stop all services
docker-compose down
```

### Seed the Database
The database is automatically seeded with test data during application startup. This includes:
- Sample users (including admin@test.com / admin123)
- Product categories and details
- Test products with images and price history
- Sample conversations and favorites

If you need to manually reseed the database, you can run:
```bash
cd backend
poetry install
poetry run python scripts/seed.py
```

## Access Points

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs (Swagger UI)
- **API Documentation**: http://localhost:8000/redoc (ReDoc)

## Project Structure
```
├── frontend/          # React application with Vite, Tailwind and MUI
│   └── src/
│
├── backend/           # FastAPI application
│   ├── app/
│   │   ├── main.py    # Application entry point
│   │   ├── db/        # Database configuration
│   │   ├── routers/   # API routes
│   │   ├── models/    # Database models
│   │   ├── schemas/   # Pydantic schemas
│   │   └── services/  # Business logic
└── docker-compose.yml # Container orchestration
```

## Development

### View Logs
```bash
# All logs including DB's
docker-compose logs -f

# Backend logs
docker logs -f fullstack_project-backend-1

# Frontend logs
docker logs -f fullstack_project-frontend-1
```

### Database Access
```bash
# MySQL
docker exec -it fullstack_project-mysql-db-1 mysql -u root -proot marketplace

# MongoDB

# Neo4j
```