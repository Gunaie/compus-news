import json
import logging
import math
import re
from typing import Literal

from fastapi import APIRouter, Request, Response, status
from pydantic import BaseModel, Field, field_validator

from utils.rate_limit import limiter

router = APIRouter(tags=["monitoring"])
logger = logging.getLogger(__name__)

CONTROL_CHARACTERS = re.compile(r"[\x00-\x1f\x7f-\x9f]")


class ClientEvent(BaseModel):
    kind: Literal["web-vital", "error"]
    name: str = Field(min_length=1, max_length=32)
    value: float | None = Field(default=None, allow_inf_nan=False)
    path: str = Field(min_length=1, max_length=512)
    message: str | None = Field(default=None, max_length=500)
    timestamp: int | None = None

    @field_validator("value", mode="before")
    @classmethod
    def reject_non_finite_numbers(cls, value):
        if isinstance(value, float) and not math.isfinite(value):
            return "non-finite"
        return value

    @field_validator("name", "path", "message", mode="before")
    @classmethod
    def remove_control_characters(cls, value):
        if isinstance(value, str):
            return CONTROL_CHARACTERS.sub("", value)
        return value


@router.post("/api/metrics", status_code=status.HTTP_204_NO_CONTENT)
@limiter.limit("30/minute")
async def collect_client_event(request: Request, event: ClientEvent):
    logger.info(json.dumps(event.model_dump(exclude_none=True), ensure_ascii=False))
    return Response(status_code=status.HTTP_204_NO_CONTENT)
