import json
import logging
import os
from logging.handlers import TimedRotatingFileHandler

from config.settings import settings


class JsonFormatter(logging.Formatter):
    def format(self, record):
        message = record.getMessage()
        payload = {
            "timestamp": self.formatTime(record, "%Y-%m-%dT%H:%M:%S%z"),
            "level": record.levelname.lower(),
            "logger": record.name,
            "request_id": getattr(record, "request_id", "N/A"),
            "message": message,
        }
        try:
            details = json.loads(message)
            if isinstance(details, dict):
                payload.update(details)
                if "message" not in details:
                    payload.pop("message", None)
        except (TypeError, ValueError):
            pass
        if record.exc_info:
            payload["exception"] = self.formatException(record.exc_info)
        return json.dumps(payload, ensure_ascii=False, default=str)


def setup_logging():
    log_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "logs")
    os.makedirs(log_dir, exist_ok=True)

    logger = logging.getLogger()
    logger.setLevel(logging.DEBUG if settings.DEBUG else logging.INFO)

    formatter = JsonFormatter()

    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.DEBUG if settings.DEBUG else logging.INFO)
    console_handler.setFormatter(formatter)

    file_handler = TimedRotatingFileHandler(
        os.path.join(log_dir, "app.log"),
        when="midnight",
        backupCount=7,
        encoding="utf-8"
    )
    file_handler.setLevel(logging.INFO)
    file_handler.setFormatter(formatter)

    class DefaultRequestIdFilter(logging.Filter):
        def filter(self, record):
            if not hasattr(record, 'request_id'):
                record.request_id = "N/A"
            return True

    console_handler.addFilter(DefaultRequestIdFilter())
    file_handler.addFilter(DefaultRequestIdFilter())

    logger.addHandler(console_handler)
    logger.addHandler(file_handler)


class RequestIdFilter(logging.Filter):
    def __init__(self, request_id: str = None):
        self.request_id = request_id

    def filter(self, record):
        record.request_id = self.request_id or "N/A"
        return True
