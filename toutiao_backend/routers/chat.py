from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
import httpx
import json

from config.db_conf import get_db
from utils.auth import get_current_user
from utils.response import success_response

router = APIRouter(prefix="/api/chat", tags=["chat"])

DASHSCOPE_API_KEY = "sk-e835f544a996476eb0393c3d430a8008"
DASHSCOPE_API_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions"
MODEL_NAME = "kimi-k2.6"


class ChatRequest(BaseModel):
    message: str
    history: list = []


@router.post("/completion")
async def chat_completion(
    request: ChatRequest,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user)
):
    messages = []

    for item in request.history:
        messages.append({"role": "user", "content": item["user"]})
        messages.append({"role": "assistant", "content": item["assistant"]})

    messages.append({"role": "user", "content": request.message})

    headers = {
        "Authorization": f"Bearer {DASHSCOPE_API_KEY}",
        "Content-Type": "application/json"
    }

    body = {
        "model": MODEL_NAME,
        "messages": messages,
        "temperature": 0.7,
        "max_tokens": 2048
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(DASHSCOPE_API_URL, headers=headers, json=body)
            response.raise_for_status()
            result = response.json()

            if result.get("choices") and len(result["choices"]) > 0:
                answer = result["choices"][0]["message"]["content"]
                return success_response(message="success", data={"answer": answer})
            else:
                error_msg = result.get("error", {}).get("message", "AI服务返回异常")
                raise HTTPException(status_code=500, detail=error_msg)

    except httpx.HTTPError as e:
        raise HTTPException(status_code=500, detail=f"AI服务请求失败: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI服务处理异常: {str(e)}")