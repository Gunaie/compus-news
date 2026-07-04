from fastapi import FastAPI, Request
from routers import news, users, favorite, history, image, chat, health
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from config.settings import settings
from utils.exception_handlers import register_exception_handlers
from utils.rate_limit import register_rate_limit, limiter
from utils.logger import setup_logging
from utils.request_id import RequestIdMiddleware


@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_logging()
    yield


app = FastAPI(lifespan=lifespan)

app.add_middleware(RequestIdMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

register_exception_handlers(app)
register_rate_limit(app)


@app.get("/")
async def root():
    return {"message": "Campus News API", "version": "1.0.0"}


@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}


app.include_router(news.router)
app.include_router(users.router)
app.include_router(favorite.router)
app.include_router(history.router)
app.include_router(image.router)
app.include_router(chat.router)
app.include_router(health.router)