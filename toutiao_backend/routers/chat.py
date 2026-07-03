from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
import httpx
import json
import os
from dotenv import load_dotenv

from config.db_conf import get_db
from utils.auth import get_current_user
from utils.response import success_response

router = APIRouter(prefix="/api/chat", tags=["chat"])

load_dotenv()

DASHSCOPE_API_KEY = os.getenv("DASHSCOPE_API_KEY", "")
DASHSCOPE_API_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions"
MODEL_NAME = os.getenv("DASHSCOPE_MODEL", "kimi-k2.6")


class ChatRequest(BaseModel):
    message: str
    history: list = []


def get_mock_response(message: str) -> str:
    mock_responses = {
        "你好": "你好！我是AI助手，很高兴为你服务。",
        "今天天气怎么样": "抱歉，我无法获取实时天气信息。建议你查看手机上的天气应用。",
        "今天是星期几": "抱歉，我无法获取实时日期信息。建议你查看手机或电脑上的时间。",
        "谢谢": "不客气！有什么问题随时问我。",
        "再见": "再见！祝你有美好的一天。"
    }
    for key, value in mock_responses.items():
        if key in message:
            return value
    return "抱歉，AI服务暂时不可用，请稍后再试。你可以尝试问我一些简单的问题。"


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

    if not DASHSCOPE_API_KEY or len(DASHSCOPE_API_KEY) < 10:
        mock_answer = get_mock_response(request.message)
        return success_response(message="success", data={"answer": mock_answer})

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
                mock_answer = get_mock_response(request.message)
                return success_response(message="success", data={"answer": mock_answer})

    except httpx.HTTPError as e:
        mock_answer = get_mock_response(request.message)
        return success_response(message="success", data={"answer": mock_answer})
    except Exception as e:
        mock_answer = get_mock_response(request.message)
        return success_response(message="success", data={"answer": mock_answer})