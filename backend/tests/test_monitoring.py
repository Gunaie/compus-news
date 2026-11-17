import json
import logging
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from fastapi import FastAPI
import httpx
import pytest

from routers import monitoring
from utils.logger import JsonFormatter


app = FastAPI()
app.include_router(monitoring.router)


@pytest.fixture(autouse=True)
def disable_external_rate_limit_storage(monkeypatch):
    monkeypatch.setattr(monitoring.limiter, "enabled", False)


async def post_event(payload=None, content=None):
    async with httpx.AsyncClient(
        transport=httpx.ASGITransport(app=app), base_url="http://test"
    ) as client:
        if content is not None:
            return await client.post(
                "/api/metrics", content=content, headers={"Content-Type": "application/json"}
            )
        return await client.post("/api/metrics", json=payload)


@pytest.mark.asyncio
async def test_metrics_returns_204_and_logs_sanitized_json(monkeypatch, caplog):
    caplog.set_level(logging.INFO, logger=monitoring.__name__)

    response = await post_event(
        {
            "kind": "web-vital",
            "name": "LCP\n",
            "value": 123.5,
            "path": "/news\x00",
            "message": "slow\n",
            "timestamp": 1700000000,
        }
    )

    assert response.status_code == 204
    assert response.content == b""
    event = json.loads(caplog.records[-1].getMessage())
    assert event == {
        "kind": "web-vital",
        "name": "LCP",
        "value": 123.5,
        "path": "/news",
        "message": "slow",
        "timestamp": 1700000000,
    }
    formatted_event = json.loads(JsonFormatter().format(caplog.records[-1]))
    assert formatted_event["kind"] == "web-vital"
    assert formatted_event["message"] == "slow"


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "payload",
    [
        {"kind": "other", "name": "LCP", "path": "/"},
        {"kind": "web-vital", "name": "x" * 33, "path": "/"},
        {"kind": "web-vital", "name": "LCP", "path": "/" * 513},
        {"kind": "error", "name": "JS", "path": "/", "message": "x" * 501},
        {"kind": "error", "name": "JS", "path": "/", "timestamp": "now"},
    ],
)
async def test_metrics_rejects_invalid_fields(payload):
    response = await post_event(payload)

    assert response.status_code == 422


@pytest.mark.asyncio
@pytest.mark.parametrize("value", ["NaN", "Infinity", "-Infinity"])
async def test_metrics_rejects_non_finite_values(value):
    content = (
        '{"kind":"web-vital","name":"LCP","path":"/","value":'
        + value
        + "}"
    )

    response = await post_event(content=content)

    assert response.status_code == 422
