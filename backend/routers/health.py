from fastapi import APIRouter
from fastapi.responses import JSONResponse
from sqlalchemy import text

from config.cache_conf import create_redis_client
from config.db_conf import AsyncSessionLocal
from utils.response import success_response

router = APIRouter(prefix="/api/health", tags=["health"])


async def check_database() -> str | None:
    try:
        async with AsyncSessionLocal() as session:
            await session.execute(text("SELECT 1"))
        return None
    except Exception:
        return "数据库连接失败"


async def check_redis() -> str | None:
    try:
        client = await create_redis_client()
        await client.ping()
        return None
    except Exception:
        return "Redis连接失败"


def unavailable_response(message: str, data: dict) -> JSONResponse:
    return JSONResponse(
        status_code=503,
        content={"code": 503, "message": message, "data": data},
    )


@router.get("")
async def health_check():
    return success_response(message="success", data={"status": "healthy", "service": "campus-news-api"})


@router.get("/db")
async def health_check_db():
    error = await check_database()
    if error:
        return unavailable_response(
            error, {"status": "unhealthy", "component": "database"}
        )
    return success_response(message="数据库连接正常", data={"status": "healthy", "component": "database"})


@router.get("/redis")
async def health_check_redis():
    error = await check_redis()
    if error:
        return unavailable_response(
            error, {"status": "unhealthy", "component": "redis"}
        )
    return success_response(message="Redis连接正常", data={"status": "healthy", "component": "redis"})


@router.get("/ready")
async def health_check_ready():
    database_error = await check_database()
    redis_error = await check_redis()
    if database_error or redis_error:
        return unavailable_response(
            "服务未就绪",
            {
                "status": "not_ready",
                "components": {
                    "database": "unhealthy" if database_error else "healthy",
                    "redis": "unhealthy" if redis_error else "healthy",
                },
            },
        )
    return success_response(
        message="服务就绪",
        data={
            "status": "ready",
            "components": {"database": "healthy", "redis": "healthy"},
        },
    )
