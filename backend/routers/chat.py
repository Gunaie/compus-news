from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
import httpx
import logging

from config.db_conf import get_db
from config.settings import settings
from utils.auth import get_current_user
from utils.response import success_response
from utils.rate_limit import limiter

router = APIRouter(prefix="/api/chat", tags=["chat"])

logger = logging.getLogger(__name__)


class ChatRequest(BaseModel):
    message: str
    history: list = []


def get_mock_response(message: str) -> str:
    mock_responses = {
        "你好": "[模拟回复] 你好！我是AI助手，很高兴为你服务。",
        "今天天气怎么样": "[模拟回复] 抱歉，我无法获取实时天气信息。建议你查看手机上的天气应用。",
        "今天是星期几": "[模拟回复] 抱歉，我无法获取实时日期信息。建议你查看手机或电脑上的时间。",
        "谢谢": "[模拟回复] 不客气！有什么问题随时问我。",
        "再见": "[模拟回复] 再见！祝你有美好的一天。"
    }
    for key, value in mock_responses.items():
        if key in message:
            return value
    return "[模拟回复] 抱歉，AI服务暂时不可用，请稍后再试。你可以尝试问我一些简单的问题。"


@router.post("/completion")
@limiter.limit("10/minute")
async def chat_completion(
    request: Request,
    chat_request: ChatRequest,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user)
):
    messages = []

    for item in chat_request.history:
        messages.append({"role": "user", "content": item["user"]})
        messages.append({"role": "assistant", "content": item["assistant"]})

    messages.append({"role": "user", "content": chat_request.message})

    if not settings.DASHSCOPE_API_KEY or len(settings.DASHSCOPE_API_KEY) < 10:
        mock_answer = get_mock_response(chat_request.message)
        return success_response(message="success", data={"answer": mock_answer})

    headers = {
        "Authorization": f"Bearer {settings.DASHSCOPE_API_KEY}",
        "Content-Type": "application/json"
    }

    body = {
        "model": settings.DASHSCOPE_MODEL,
        "messages": messages,
        "temperature": 0.7,
        "max_tokens": 2048
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(settings.DASHSCOPE_API_URL, headers=headers, json=body)
            response.raise_for_status()
            result = response.json()

            if result.get("choices") and len(result["choices"]) > 0:
                answer = result["choices"][0]["message"]["content"]
                return success_response(message="success", data={"answer": answer})
            else:
                logger.warning("AI API返回格式异常")
                mock_answer = get_mock_response(chat_request.message)
                return success_response(message="success", data={"answer": mock_answer})

    except httpx.HTTPError as e:
        logger.error(f"AI API请求失败: {str(e)}")
        mock_answer = get_mock_response(chat_request.message)
        return success_response(message="success", data={"answer": mock_answer})
    except httpx.TimeoutException as e:
        logger.error(f"AI API请求超时: {str(e)}")
        mock_answer = get_mock_response(chat_request.message)
        return success_response(message="success", data={"answer": mock_answer})
    except KeyError as e:
        logger.error(f"AI API响应解析失败: {str(e)}")
        mock_answer = get_mock_response(chat_request.message)
        return success_response(message="success", data={"answer": mock_answer})
    except Exception as e:
        logger.error(f"AI聊天异常: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="AI服务异常，请稍后再试")
