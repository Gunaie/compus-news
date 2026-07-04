from fastapi import APIRouter
from sqlalchemy.ext.asyncio import AsyncSession

from config.db_conf import AsyncSessionLocal
from config.cache_conf import create_redis_client
from utils.response import success_response

router = APIRouter(prefix="/api/health", tags=["health"])


@router.get("")
async def health_check():
    return success_response(message="success", data={"status": "healthy", "service": "campus-news-api"})


@router.get("/db")
async def health_check_db():
    try:
        async with AsyncSessionLocal() as session:
            await session.execute("SELECT 1")
        return success_response(message="数据库连接正常", data={"status": "healthy", "component": "database"})
    except Exception as e:
        return {"code": 500, "message": f"数据库连接失败: {str(e)}", "data": {"status": "unhealthy", "component": "database"}}


@router.get("/redis")
async def health_check_redis():
    try:
        client = await create_redis_client()
        await client.ping()
        return success_response(message="Redis连接正常", data={"status": "healthy", "component": "redis"})
    except Exception as e:
        return {"code": 500, "message": f"Redis连接失败: {str(e)}", "data": {"status": "unhealthy", "component": "redis"}}
