from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import Response
import httpx
from urllib.parse import urlparse
import ipaddress

router = APIRouter(prefix="/api/image", tags=["图片代理"])

ALLOWED_DOMAINS = {"picsum.photos", "fastly.jsdelivr.net"}

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
        for network in BLOCKED_IP_RANGES:
            if ip_addr in network:
                return True
        return False
    except ValueError:
        return True


def is_url_allowed(url: str) -> bool:
    parsed = urlparse(url)
    
    if parsed.scheme not in ("http", "https"):
        return False
    
    if not parsed.hostname:
        return False
    
    if parsed.hostname in ALLOWED_DOMAINS:
        return True
    
    if parsed.hostname.replace("www.", "") in ALLOWED_DOMAINS:
        return True
    
    try:
        ip_addr = ipaddress.ip_address(parsed.hostname)
        return not is_ip_in_blocked_range(str(ip_addr))
    except ValueError:
        return False


@router.get("/proxy")
async def proxy_image(
    url: str = Query(..., description="图片URL")
):
    if not is_url_allowed(url):
        raise HTTPException(status_code=403, detail="不允许访问该图片源")
    
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
            "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
            "Referer": "https://picsum.photos/"
        }
        
        async with httpx.AsyncClient(follow_redirects=True, timeout=10.0, headers=headers) as client:
            response = await client.get(url)
            if response.status_code != 200:
                raise HTTPException(status_code=response.status_code, detail="图片获取失败")
            
            content_type = response.headers.get("content-type", "image/jpeg")
            
            response_headers = {
                "Content-Type": content_type,
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
                "Access-Control-Allow-Headers": "Origin, Content-Type, Accept, Authorization",
                "Cache-Control": "public, max-age=31536000",
                "Referrer-Policy": "no-referrer",
                "Cross-Origin-Resource-Policy": "cross-origin",
                "Cross-Origin-Embedder-Policy": "unsafe-none"
            }
            
            return Response(content=response.content, media_type=content_type, headers=response_headers)
    except httpx.RequestError as e:
        raise HTTPException(status_code=500, detail=f"请求失败: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
