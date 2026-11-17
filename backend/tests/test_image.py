import os
import sys
from io import BytesIO
from types import SimpleNamespace

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from fastapi import FastAPI
import httpx
from PIL import Image
import pytest

from routers import image


app = FastAPI()
app.include_router(image.router)


def make_image(width=320, height=240, image_format="JPEG"):
    output = BytesIO()
    Image.new("RGB", (width, height), "blue").save(output, format=image_format)
    return output.getvalue()


def make_response(content, url="https://picsum.photos/seed/test/320/240", content_type="image/jpeg"):
    return httpx.Response(
        200,
        content=content,
        headers={"Content-Type": content_type},
        request=httpx.Request("GET", url),
    )


def mock_upstream(monkeypatch, response):
    class MockAsyncClient:
        def __init__(self, *args, **kwargs):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc, traceback):
            return None

        async def get(self, url):
            return response

    monkeypatch.setattr(
        image,
        "httpx",
        SimpleNamespace(AsyncClient=MockAsyncClient, RequestError=httpx.RequestError),
    )


async def request_proxy(query):
    async with httpx.AsyncClient(
        transport=httpx.ASGITransport(app=app), base_url="http://test"
    ) as client:
        return await client.get("/api/image/proxy", params=query)


@pytest.mark.asyncio
async def test_proxy_converts_to_webp_and_resizes(monkeypatch):
    mock_upstream(monkeypatch, make_response(make_image()))

    response = await request_proxy(
        {
            "url": "https://picsum.photos/seed/test/320/240",
            "w": 200,
            "h": 160,
            "format": "webp",
            "quality": 80,
        }
    )

    assert response.status_code == 200
    assert response.headers["content-type"] == "image/webp"
    assert response.headers["cache-control"] == "public, max-age=31536000, immutable"
    with Image.open(BytesIO(response.content)) as result:
        assert result.format == "WEBP"
        assert result.size == (200, 160)


@pytest.mark.asyncio
async def test_proxy_converts_to_webp_without_dimensions(monkeypatch):
    mock_upstream(
        monkeypatch,
        make_response(make_image(24, 12, "PNG"), content_type="image/png"),
    )

    response = await request_proxy(
        {"url": "https://picsum.photos/seed/test/24/12", "format": "webp"}
    )

    assert response.status_code == 200
    with Image.open(BytesIO(response.content)) as result:
        assert result.format == "WEBP"
        assert result.size == (24, 12)


@pytest.mark.asyncio
async def test_proxy_resizes_original_with_aspect_ratio(monkeypatch):
    mock_upstream(monkeypatch, make_response(make_image()))

    response = await request_proxy(
        {
            "url": "https://fastly.jsdelivr.net/gh/example/image.jpg",
            "w": 100,
            "format": "original",
        }
    )

    assert response.status_code == 200
    assert response.headers["content-type"] == "image/jpeg"
    with Image.open(BytesIO(response.content)) as result:
        assert result.format == "JPEG"
        assert result.size == (100, 75)


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "url",
    [
        "https://example.com/image.jpg",
        "http://127.0.0.1/image.jpg",
        "http://169.254.169.254/latest/meta-data",
    ],
)
async def test_proxy_rejects_disallowed_source(monkeypatch, url):
    mock_upstream(monkeypatch, make_response(make_image()))

    response = await request_proxy({"url": url, "format": "webp"})

    assert response.status_code == 403


@pytest.mark.asyncio
async def test_proxy_accepts_picsum_cdn_redirect(monkeypatch):
    mock_upstream(
        monkeypatch,
        make_response(make_image(), url="https://fastly.picsum.photos/id/8/320/240.jpg"),
    )

    response = await request_proxy(
        {"url": "https://picsum.photos/seed/test/320/240", "format": "webp"}
    )

    assert response.status_code == 200
    assert response.headers["content-type"] == "image/webp"


@pytest.mark.asyncio
async def test_proxy_rejects_disallowed_final_redirect_url(monkeypatch):
    mock_upstream(
        monkeypatch,
        make_response(make_image(), url="http://169.254.169.254/latest/meta-data"),
    )

    response = await request_proxy(
        {"url": "https://picsum.photos/seed/test/320/240", "format": "webp"}
    )

    assert response.status_code == 403


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "params",
    [
        {"w": 0},
        {"h": 4097},
        {"quality": 0},
        {"quality": 101},
        {"format": "avif"},
    ],
)
async def test_proxy_rejects_invalid_parameters(monkeypatch, params):
    mock_upstream(monkeypatch, make_response(make_image()))

    response = await request_proxy(
        {"url": "https://picsum.photos/seed/test/320/240", **params}
    )

    assert response.status_code == 422


@pytest.mark.asyncio
async def test_proxy_rejects_non_image_content_when_processing(monkeypatch):
    mock_upstream(
        monkeypatch,
        make_response(b"not an image", content_type="image/jpeg"),
    )

    response = await request_proxy(
        {"url": "https://picsum.photos/seed/test/320/240", "format": "webp"}
    )

    assert response.status_code == 415


@pytest.mark.asyncio
async def test_proxy_rejects_non_image_content_type_without_processing(monkeypatch):
    mock_upstream(
        monkeypatch,
        make_response(b"plain text", content_type="text/plain"),
    )

    response = await request_proxy(
        {"url": "https://picsum.photos/seed/test/320/240"}
    )

    assert response.status_code == 415
