from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.routers import auth, products, admin, profile
from app.db.mysql import create_tables
from app.config import get_settings
from app.middleware import (
    http_exception_handler,
    validation_exception_handler,
    general_exception_handler
)

settings = get_settings()

app = FastAPI(
    title="Marketplace API",
    description="A modern marketplace platform where users can list and sell products",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Create database tables on startup
@app.on_event("startup")
async def startup_event():
    create_tables()

# Add exception handlers
app.add_exception_handler(StarletteHTTPException, http_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(Exception, general_exception_handler)

# Configure CORS
cors_origins = settings.cors_origins.split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(products.router, prefix="/api/products", tags=["Products"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])
app.include_router(profile.router, prefix="/api/profile", tags=["Profile"])

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Marketplace API is running!",
        "status": "healthy"
    }

@app.get("/health")
async def health_check():
    """Detailed health check endpoint for monitoring"""
    return {
        "status": "healthy",
        "environment": settings.environment,
        "message": "Marketplace API is running!",
        "databases": {
            "mysql_configured": bool(settings.database_url)
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=settings.api_host, port=settings.api_port)
