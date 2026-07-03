import aiomysql
import asyncio

async def check_table():
    conn = await aiomysql.connect(host='localhost', port=3306, user='root', password='12345678', db='news_app')
    cur = await conn.cursor()
    await cur.execute("SHOW TABLES LIKE 'history'")
    result = await cur.fetchall()
    print('history表:', '存在' if result else '不存在')
    
    await cur.execute("SHOW TABLES LIKE 'news'")
    result = await cur.fetchall()
    print('news表:', '存在' if result else '不存在')
    
    await cur.execute("SELECT COUNT(*) FROM news")
    result = await cur.fetchone()
    print('news记录数:', result[0])
    
    await cur.close()
    await conn.close()

asyncio.run(check_table())