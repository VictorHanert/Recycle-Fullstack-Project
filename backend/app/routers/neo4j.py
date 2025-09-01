from fastapi import APIRouter, HTTPException
import os

router = APIRouter()

@router.get("/health")
async def neo4j_health():
    """Check Neo4j connection health"""
    try:
        neo4j_url = os.getenv("NEO4J_URL")
        if not neo4j_url:
            raise HTTPException(status_code=500, detail="Neo4j not configured")
        
        return {
            "status": "healthy",
            "database": "neo4j",
            "url": neo4j_url.split("://")[1] if "://" in neo4j_url else "unknown"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Neo4j connection failed: {str(e)}")

# Ideas for Neo4j:
# - product recommendations
# - related products
# - market insights using graph analytics?
