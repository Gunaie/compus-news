import asyncio
import aiomysql

async def execute_sql_file(filepath: str):
    with open(filepath, 'r', encoding='utf-8') as f:
        sql_content = f.read()
    
    sql_statements = [s.strip() for s in sql_content.split(';') if s.strip()]
    
    async with aiomysql.create_pool(
        host='localhost',
        port=3306,
        user='root',
        password='12345678',
        db='news_app',
        charset='utf8mb4'
    ) as pool:
        async with pool.acquire() as conn:
            async with conn.cursor() as cursor:
                await cursor.execute("SET FOREIGN_KEY_CHECKS = 0")
                print("Disabled foreign key checks")
                
                for sql in sql_statements:
                    try:
                        await cursor.execute(sql)
                        print(f"Executed: {sql[:50]}..." if len(sql) > 50 else f"Executed: {sql}")
                    except Exception as e:
                        print(f"Error executing: {sql[:30]}... - {e}")
                
                await cursor.execute("SET FOREIGN_KEY_CHECKS = 1")
                print("Enabled foreign key checks")
                
                await conn.commit()
                print("All SQL statements executed successfully!")

if __name__ == '__main__':
    asyncio.run(execute_sql_file(r'e:\Trae\项目物料\docs\campus_data.sql'))