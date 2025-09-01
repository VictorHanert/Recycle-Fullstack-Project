from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv

from app.routers import auth, products, admin, mysql, mongodb, neo4j

# Load environment variables
load_dotenv()

app = FastAPI(
    title="Marketplace Fullstack",
    description="A marketplace platform where users can list and sell products",
    version="1.0.0"
)

# Configure CORS
cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
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
app.include_router(mysql.router, prefix="/api/mysql", tags=["MySQL"])
app.include_router(mongodb.router, prefix="/api/mongodb", tags=["MongoDB"])
app.include_router(neo4j.router, prefix="/api/neo4j", tags=["Neo4j"])

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "message": "Marketplace API is running!",
        "status": "healthy",
        "version": "1.0.0"
    }

@app.get("/health")
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "environment": "development",
        "databases": {
            "mysql_configured": bool(os.getenv("DATABASE_URL")),
            "mongodb_configured": bool(os.getenv("MONGODB_URL")),
            "neo4j_configured": bool(os.getenv("NEO4J_URL"))
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
