from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import Response
import httpx

router = APIRouter(prefix="/api/image", tags=["图片代理"])


@router.get("/proxy")
async def proxy_image(
    url: str = Query(..., description="图片URL")
):
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