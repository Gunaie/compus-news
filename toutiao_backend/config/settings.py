from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    DEBUG: bool = True

    DATABASE_URL: str = "mysql+aiomysql://root:12345678@localhost:3306/news_app?charset=utf8mb4"
    DATABASE_POOL_SIZE: int = 10
    DATABASE_MAX_OVERFLOW: int = 20

    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 0

    JWT_SECRET_KEY: str = "campus-news-jwt-secret-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:8080"

    DASHSCOPE_API_KEY: str = ""
    DASHSCOPE_API_URL: str = "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions"
    DASHSCOPE_MODEL: str = "kimi-k2.6"

    RATE_LIMIT_STORAGE_URL: str = "redis://localhost:6379/1"


settings = Settings()