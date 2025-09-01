from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = FastAPI(
    title="Fullstack Project API",
    description="A FastAPI backend with MySQL, MongoDB, and Neo4j support",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "message": "Backend is running!",
        "status": "healthy",
        "databases": {
            "mysql": os.getenv("DATABASE_URL", "Not configured"),
            "mongodb": os.getenv("MONGODB_URL", "Not configured"),
            "neo4j": os.getenv("NEO4J_URL", "Not configured")
        }
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

@app.get("/api/test")
async def test_endpoint():
    """Test API endpoint"""
    return {"message": "API is working!"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
