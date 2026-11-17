import asyncio
from io import BytesIO
import ipaddress
from urllib.parse import urlparse

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import Response
import httpx
from PIL import Image, UnidentifiedImageError

router = APIRouter(prefix="/api/image", tags=["图片代理"])

ALLOWED_DOMAINS = {"picsum.photos", "fastly.picsum.photos", "fastly.jsdelivr.net"}
OUTPUT_FORMATS = {"JPEG", "PNG", "WEBP", "GIF", "BMP", "TIFF"}

BLOCKED_IP_RANGES = [
    ipaddress.ip_network("10.0.0.0/8"),
    ipaddress.ip_network("172.16.0.0/12"),
    ipaddress.ip_network("192.168.0.0/16"),
    ipaddress.ip_network("127.0.0.0/8"),
    ipaddress.ip_network("169.254.0.0/16"),
    ipaddress.ip_network("0.0.0.0/8"),
    ipaddress.ip_network("224.0.0.0/4"),
    ipaddress.ip_network("255.255.255.255/32"),
]


def is_ip_in_blocked_range(ip: str) -> bool:
    try:
        ip_addr = ipaddress.ip_address(ip)
        return any(ip_addr in network for network in BLOCKED_IP_RANGES)
    except ValueError:
        return True


def is_url_allowed(url: str) -> bool:
    try:
        parsed = urlparse(url)
        hostname = parsed.hostname
    except ValueError:
        return False

    if parsed.scheme not in ("http", "https") or not hostname:
        return False

    hostname = hostname.rstrip(".").lower()
    if hostname in ALLOWED_DOMAINS:
        return True
    if hostname.startswith("www.") and hostname[4:] in ALLOWED_DOMAINS:
        return True

    return False


def _process_image(
    content: bytes,
    width: int | None,
    height: int | None,
    output_format: str | None,
    quality: int,
) -> tuple[bytes, str]:
    with Image.open(BytesIO(content)) as source:
        source.load()
        source_format = (source.format or "").upper()
        target_format = source_format if output_format in (None, "original") else output_format.upper()
        if target_format not in OUTPUT_FORMATS:
            raise ValueError("不支持的输出图片格式")

        if target_format == "WEBP" and source.mode not in ("RGB", "RGBA"):
            source = source.convert("RGBA" if "transparency" in source.info else "RGB")
        elif target_format == "JPEG" and source.mode not in ("RGB", "L"):
            source = source.convert("RGB")

        if width or height:
            source_width, source_height = source.size
            target_width = width or round(source_width * height / source_height)
            target_height = height or round(source_height * width / source_width)
            if target_width < 1 or target_height < 1:
                raise ValueError("图片缩放尺寸无效")
            source = source.resize((target_width, target_height), Image.Resampling.LANCZOS)

        output = BytesIO()
        save_options = {"quality": quality} if target_format in ("JPEG", "WEBP") else {}
        source.save(output, format=target_format, **save_options)

    media_type = "image/jpeg" if target_format == "JPEG" else f"image/{target_format.lower()}"
    return output.getvalue(), media_type


@router.get("/proxy")
async def proxy_image(
    url: str = Query(..., description="图片URL"),
    w: int | None = Query(default=None, ge=1, le=4096, description="目标宽度"),
    h: int | None = Query(default=None, ge=1, le=4096, description="目标高度"),
    format: str | None = Query(default=None, description="输出格式：original 或 webp"),
    quality: int = Query(default=80, ge=1, le=100, description="WebP/JPEG 质量"),
):
    if not is_url_allowed(url):
        raise HTTPException(status_code=403, detail="不允许访问该图片源")
    if format is not None and format.lower() not in ("original", "webp"):
        raise HTTPException(status_code=422, detail="format 仅支持 original 或 webp")

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
        "Referer": "https://picsum.photos/",
    }

    try:
        async with httpx.AsyncClient(follow_redirects=True, timeout=10.0, headers=headers) as client:
            response = await client.get(url)
    except httpx.RequestError as exc:
        raise HTTPException(status_code=502, detail="图片获取失败") from exc

    if response.status_code != 200:
        raise HTTPException(status_code=502, detail="图片获取失败")
    if not is_url_allowed(str(response.url)):
        raise HTTPException(status_code=403, detail="不允许访问该图片源")

    content_type = response.headers.get("content-type", "").split(";", 1)[0].strip().lower()
    needs_processing = w is not None or h is not None or (format is not None and format.lower() == "webp")
    if needs_processing:
        try:
            content, content_type = await asyncio.to_thread(
                _process_image, response.content, w, h, format, quality
            )
        except (UnidentifiedImageError, OSError, ValueError) as exc:
            raise HTTPException(status_code=415, detail="响应内容不是可处理的图片") from exc
    else:
        content = response.content
        if not content_type.startswith("image/"):
            raise HTTPException(status_code=415, detail="响应内容不是图片")

    response_headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Origin, Content-Type, Accept, Authorization",
        "Cache-Control": "public, max-age=31536000, immutable",
        "Referrer-Policy": "no-referrer",
        "Cross-Origin-Resource-Policy": "cross-origin",
        "Cross-Origin-Embedder-Policy": "unsafe-none",
        "X-Content-Type-Options": "nosniff",
    }
    return Response(content=content, media_type=content_type, headers=response_headers)
