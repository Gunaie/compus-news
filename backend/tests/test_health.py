import json
import os
import sys
from unittest.mock import AsyncMock

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import pytest

from routers import health


class FakeSession:
    def __init__(self, statements, error=None):
        self.statements = statements
        self.error = error

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc, traceback):
        return None

    async def execute(self, statement):
        self.statements.append(str(statement))
        if self.error:
            raise self.error


class FakeRedis:
    def __init__(self, error=None):
        self.error = error
        self.ping_count = 0

    async def ping(self):
        self.ping_count += 1
        if self.error:
            raise self.error


def response_json(response):
    return json.loads(response.body)


@pytest.mark.asyncio
async def test_ready_checks_database_and_redis(monkeypatch):
    statements = []
    redis = FakeRedis()
    monkeypatch.setattr(health, "AsyncSessionLocal", lambda: FakeSession(statements))

    async def get_redis():
        return redis

    monkeypatch.setattr(health, "create_redis_client", get_redis)

    response = await health.health_check_ready()

    assert response.status_code == 200
    assert statements == ["SELECT 1"]
    assert redis.ping_count == 1
    assert response_json(response)["data"] == {
        "status": "ready",
        "components": {"database": "healthy", "redis": "healthy"},
    }


@pytest.mark.asyncio
async def test_database_component_returns_real_503(monkeypatch):
    monkeypatch.setattr(
        health,
        "AsyncSessionLocal",
        lambda: FakeSession([], RuntimeError("database unavailable")),
    )

    response = await health.health_check_db()

    assert response.status_code == 503
    assert response_json(response)["data"]["status"] == "unhealthy"


@pytest.mark.asyncio
async def test_redis_component_returns_real_503(monkeypatch):
    redis = FakeRedis(RuntimeError("redis unavailable"))

    async def get_redis():
        return redis

    monkeypatch.setattr(health, "create_redis_client", get_redis)

    response = await health.health_check_redis()

    assert response.status_code == 503
    assert redis.ping_count == 1


@pytest.mark.asyncio
async def test_ready_returns_503_when_database_fails_and_still_checks_redis(monkeypatch):
    monkeypatch.setattr(
        health,
        "AsyncSessionLocal",
        lambda: FakeSession([], RuntimeError("database unavailable")),
    )
    check_redis = AsyncMock(return_value=None)
    monkeypatch.setattr(health, "check_redis", check_redis)

    response = await health.health_check_ready()

    assert response.status_code == 503
    check_redis.assert_awaited_once()
    assert response_json(response)["data"]["components"] == {
        "database": "unhealthy",
        "redis": "healthy",
    }


@pytest.mark.asyncio
async def test_ready_returns_503_when_redis_fails(monkeypatch):
    monkeypatch.setattr(health, "check_database", AsyncMock(return_value=None))
    redis = FakeRedis(RuntimeError("redis unavailable"))

    async def get_redis():
        return redis

    monkeypatch.setattr(health, "create_redis_client", get_redis)

    response = await health.health_check_ready()

    assert response.status_code == 503
    assert response_json(response)["data"]["components"] == {
        "database": "healthy",
        "redis": "unhealthy",
    }
