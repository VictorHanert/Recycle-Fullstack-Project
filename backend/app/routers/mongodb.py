from fastapi import APIRouter, HTTPException
import os

router = APIRouter()

@router.get("/health")
async def mongodb_health():
    """Check MongoDB connection health"""
    try:
        mongodb_url = os.getenv("MONGODB_URL")
        if not mongodb_url:
            raise HTTPException(status_code=500, detail="MongoDB not configured")
        
        return {
            "status": "healthy",
            "database": "mongodb",
            "url": mongodb_url.split("://")[1] if "://" in mongodb_url else "unknown"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"MongoDB connection failed: {str(e)}")

# Ideas for mongoDB:
# - product reviews
# - search logs
# - messages and likes
