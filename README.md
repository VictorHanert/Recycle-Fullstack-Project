# <img src="frontend/public/favicon.png" alt="Recycle logo" style="height:1em; vertical-align:middle; width:auto;" /> Recycle Marketplace

A modern fullstack web application for buying and selling bicycles. Users can browse products, manage favorites, send messages to sellers, and more.

**Live Demo**: [https://recycle-marketplace.vercel.app/](https://recycle-marketplace.vercel.app/)

## Features

- User authentication with JWT tokens
- Product listing and browsing
- Favorites system
- Real-time messaging between users
- User profiles and product management
- Advanced search and filtering
- Admin dashboard with analytics
- Rate limiting for security (5 login attempts/minute)
- Azure Blob Storage for images
- Application monitoring with Azure Application Insights

## Tech Stack

### Frontend
![React](https://img.shields.io/badge/React-61DAFB?style=flat&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white)
![MUI](https://img.shields.io/badge/MUI-007FFF?style=flat&logo=mui&logoColor=white)
![React Router](https://img.shields.io/badge/React_Router-CA4245?style=flat&logo=react-router&logoColor=white)
![Zustand](https://img.shields.io/badge/Zustand-000000?style=flat&logo=zustand&logoColor=white)
![Eslint](https://img.shields.io/badge/ESLint-4B32C3?style=flat&logo=eslint&logoColor=white)

### Backend & Database
![Python](https://img.shields.io/badge/Python-3776AB?style=flat&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat&logo=fastapi&logoColor=white)
![Uvicorn](https://img.shields.io/badge/Uvicorn-4A4A55?style=flat&logo=uvicorn&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=flat&logo=mysql&logoColor=white)
![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-D71F00?style=flat&logo=sqlalchemy&logoColor=w8Ahite)
![Alembic](https://img.shields.io/badge/Alembic-2D3A45?style=flat&logo=alembic&logoColor=white)
![Pydantic](https://img.shields.io/badge/Pydantic-E92063?style=flat&logo=pydantic&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?style=flat&logo=json-web-tokens&logoColor=white)

### DevOps & Cloud
![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat&logo=docker&logoColor=white)
![Azure](https://img.shields.io/badge/Azure-0078D4?style=flat&logo=microsoft-azure&logoColor=white)
![Github](https://img.shields.io/badge/GitHub-181717?style=flat&logo=github&logoColor=white)
![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-2088FF?style=flat&logo=github-actions&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=flat&logo=vercel&logoColor=white)

## Getting Started

### Prerequisites
- Docker and Docker Compose installed
- Node.js 20+ (for local frontend development)
- Python 3.13+ (for local backend development)

### Start the Application

```bash
# Start whole platform (frontend, backend, and database)
docker-compose up --build -d

# Stop all services
docker-compose down
```

### Seed the Database
The MySQL database is automatically seeded with test data during application startup:
- 👤 Sample users (admin@test.com / admin123)
- 📦 Product categories and details
- 🚴 Test products with images and price history
- 💬 Sample conversations and favorites

**Manual seeding** (if needed):
```bash
cd backend
poetry install
poetry run python scripts/seed.py
```

## Access Points

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | http://localhost:5173 | React application |
| **Backend API** | http://localhost:8000 | FastAPI server |
| **API Docs (Swagger)** | http://localhost:8000/docs | Interactive API documentation |
| **API Docs (ReDoc)** | http://localhost:8000/redoc | Alternative API docs |

## Project Structure
```
├── frontend/          # React application with Vite, Tailwind and MUI
│   └── src/
│
├── backend/           # Python FastAPI app
│   ├── app/
│   │   ├── main.py         # Application entry point
│   │   ├── db/             # Database configuration
│   │   ├── models/         # Database models
│   │   ├── repositories/   # Data access layer
│   │   ├── routers/        # API routes
│   │   ├── schemas/        # Pydantic schemas
│   │   └── services/       # Business logic
│   ├── alembic/            # Database migrations
│   ├── scripts/            # Utility scripts (seeding, etc.)
│   └── tests/              # Backend tests
│
└── docker-compose.yml      # Container orchestration

## 🔐 Default Credentials

For testing purposes, use these credentials:
- **Admin**: admin@test.com / admin123
- **Regular User**: register your own
