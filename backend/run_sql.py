import asyncio
from pathlib import Path
from urllib.parse import unquote, urlparse

import aiomysql

from config.settings import settings


async def execute_sql_file(cursor, filepath: Path):
    sql_content = filepath.read_text(encoding="utf-8")
    statements = [statement.strip() for statement in sql_content.split(";") if statement.strip()]
    for statement in statements:
        await cursor.execute(statement)
    print(f"已执行 {filepath.name}")


async def main():
    database_url = urlparse(settings.DATABASE_URL)
    if database_url.scheme != "mysql+aiomysql" or not database_url.hostname or not database_url.username:
        raise ValueError("请先在 backend/.env 配置有效的 DATABASE_URL")

    pool = await aiomysql.create_pool(
        host=database_url.hostname,
        port=database_url.port or 3306,
        user=unquote(database_url.username),
        password=unquote(database_url.password or ""),
        charset="utf8mb4",
    )
    try:
        async with pool.acquire() as connection:
            try:
                async with connection.cursor() as cursor:
                    docs_dir = Path(__file__).resolve().parent.parent / "docs"
                    await execute_sql_file(cursor, docs_dir / "database.sql")
                    await execute_sql_file(cursor, docs_dir / "campus_data.sql")
                await connection.commit()
            except Exception:
                await connection.rollback()
                raise
    finally:
        pool.close()
        await pool.wait_closed()


if __name__ == "__main__":
    asyncio.run(main())
