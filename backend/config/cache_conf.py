import json
from typing import Any, Optional

import redis.asyncio as redis
from redis.asyncio import Redis

from config.settings import settings

redis_client: Optional[Redis] = None


async def create_redis_client() -> Redis:
    global redis_client
    if redis_client is None:
        redis_client = redis.Redis(
            host=settings.REDIS_HOST,
            port=settings.REDIS_PORT,
            db=settings.REDIS_DB,
            decode_responses=True,
            socket_timeout=0.5,
            socket_connect_timeout=0.5,
            health_check_interval=30,
            max_connections=100
        )
        try:
            await redis_client.ping()
        except Exception as e:
            redis_client = None
            raise
    return redis_client


async def get_cache(key: str) -> Optional[str]:
    try:
        client = await create_redis_client()
        return await client.get(key)
    except Exception:
        return None


async def get_json_cache(key: str) -> Optional[Any]:
    try:
        client = await create_redis_client()
        data = await client.get(key)
        if data:
            return json.loads(data)
        return None
    except Exception:
        return None


async def set_cache(key: str, value: Any, expire: int = 3600) -> bool:
    try:
        client = await create_redis_client()
        if isinstance(value, (dict, list)):
            value = json.dumps(value, ensure_ascii=False)
        await client.setex(key, expire, value)
        return True
    except Exception:
        return False


async def delete_cache(key: str) -> bool:
    try:
        client = await create_redis_client()
        await client.delete(key)
        return True
    except Exception:
        return False


async def flush_cache() -> bool:
    try:
        client = await create_redis_client()
        await client.flushdb()
        return True
    except Exception:
        return False
