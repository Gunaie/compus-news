import json
from typing import Any

import redis.asyncio as redis

from config.settings import settings


redis_client = None


def get_redis_client():
    global redis_client
    if redis_client is None:
        try:
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
        except Exception:
            redis_client = None
    return redis_client


async def get_cache(key: str):
    client = get_redis_client()
    if not client:
        return None
    try:
        return await client.get(key)
    except Exception:
        global redis_client
        redis_client = None
        return None


async def get_json_cache(key: str):
    client = get_redis_client()
    if not client:
        return None
    try:
        data = await client.get(key)
        if data:
            return json.loads(data)
        return None
    except Exception:
        global redis_client
        redis_client = None
        return None


async def set_cache(key: str, value: Any, expire: int = 3600):
    client = get_redis_client()
    if not client:
        return False
    try:
        if isinstance(value, (dict, list)):
            value = json.dumps(value, ensure_ascii=False)
        await client.setex(key, expire, value)
        return True
    except Exception:
        global redis_client
        redis_client = None
        return False