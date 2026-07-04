# 项目问题分析报告

## 一、项目概览

项目是一个校园资讯平台，采用前后端分离架构：
- **后端**: FastAPI + SQLAlchemy + MySQL + Redis + JWT
- **前端**: Vue3 + Vite + Vant + Pinia + Vue Router

## 二、安全问题（高危）

### 2.1 硬编码敏感信息

**文件**: [backend/config/settings.py](file:///e:/Trae/项目物料/backend/config/settings.py)

**问题描述**:
```python
DATABASE_URL: str = "mysql+aiomysql://root:12345678@localhost:3306/news_app?charset=utf8mb4"
JWT_SECRET_KEY: str = "campus-news-jwt-secret-key-change-in-production"
```

数据库密码和JWT密钥直接硬编码在代码中，存在以下风险：
- 代码泄露会导致数据库和认证系统被攻破
- 多人协作时无法区分开发/测试/生产环境
- 无法通过安全审计

**建议**:
- 创建`.env`文件并添加到`.gitignore`
- 使用环境变量覆盖默认配置
- 生产环境使用更复杂的随机密钥

---

### 2.2 SSRF（服务器端请求伪造）

**文件**: [backend/routers/image.py](file:///e:/Trae/项目物料/backend/routers/image.py)

**问题描述**:
```python
@router.get("/proxy")
async def proxy_image(url: str = Query(..., description="图片URL")):
    async with httpx.AsyncClient(follow_redirects=True, timeout=10.0, headers=headers) as client:
        response = await client.get(url)  # 直接使用用户提供的URL
```

用户可以传入任意URL，服务器会无条件发起请求，攻击者可能：
- 访问内网资源（如数据库、其他服务）
- 扫描内网端口
- 发起DDOS攻击

**建议**:
- 限制允许访问的域名白名单（仅允许`picsum.photos`等可信域名）
- 禁止访问内网IP地址（10.x.x.x, 172.16.x.x, 192.168.x.x, 127.0.0.1）
- 添加URL验证逻辑

---

### 2.3 密码规则不一致

**文件**: [backend/schemas/users.py](file:///e:/Trae/项目物料/backend/schemas/users.py)

**问题描述**:
- **注册**: `password: str = Field(..., min_length=6, max_length=128)` — 仅6-128字符
- **改密码**: `new_password: str = Field(..., min_length=8)` + 必须包含大小写字母和数字

注册时密码要求过低，可能导致弱密码风险。

**建议**:
- 统一密码规则：至少8位，包含大小写字母和数字
- 在注册和改密码时使用相同的验证逻辑

---

### 2.4 前端Token存储不安全

**文件**: [frontend/src/store/user.js](file:///e:/Trae/项目物料/frontend/src/store/user.js)

**问题描述**:
```javascript
function setToken(newToken) {
    token.value = newToken
    localStorage.setItem('token', newToken)  // localStorage不安全
}
```

`localStorage`存储JWT存在以下风险：
- XSS攻击可直接读取token
- token持久化存储，关闭浏览器后仍有效
- 无过期时间管理

**建议**:
- 使用`sessionStorage`替代（关闭标签页后自动清除）
- 设置HttpOnly Cookie存储refresh token
- 定期刷新access token

---

## 三、代码质量问题（中危）

### 3.1 不安全的哈希算法

**文件**: [backend/utils/security.py](file:///e:/Trae/项目物料/backend/utils/security.py)

**问题描述**:
```python
def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        if hashed_password.startswith('$2b$') or hashed_password.startswith('$2a$'):
            # bcrypt验证（安全）
            ...
        else:
            # SHA256验证（不安全）
            hash_part, salt = hashed_password.split(':')
            combined = f"{plain_password}{salt}"
            new_hash = hashlib.sha256(combined.encode()).hexdigest()
            return new_hash == hash_part
    except Exception:
        return False
```

SHA256作为密码哈希算法不安全：
- 计算速度快，容易被暴力破解
- 缺少密钥拉伸机制

**建议**:
- 移除SHA256逻辑，统一使用bcrypt
- 迁移现有SHA256哈希的用户密码

---

### 3.2 异常处理过于宽泛

**文件**: [backend/routers/chat.py](file:///e:/Trae/项目物料/backend/routers/chat.py)

**问题描述**:
```python
try:
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(settings.DASHSCOPE_API_URL, headers=headers, json=body)
        response.raise_for_status()
        ...
except httpx.HTTPError:
    mock_answer = get_mock_response(chat_request.message)
    return success_response(message="success", data={"answer": mock_answer})
except Exception:  # 捕获所有异常
    mock_answer = get_mock_response(chat_request.message)
    return success_response(message="success", data={"answer": mock_answer})
```

捕获所有`Exception`会隐藏真实错误，导致：
- 难以排查生产环境问题
- 可能掩盖严重的系统错误
- 用户无法得知服务状态

**建议**:
- 只捕获预期的异常类型
- 记录详细的错误日志
- 根据错误类型返回适当的HTTP状态码

---

### 3.3 路由守卫不验证Token有效性

**文件**: [frontend/src/router/index.js](file:///e:/Trae/项目物料/frontend/src/router/index.js)

**问题描述**:
```javascript
router.beforeEach((to, from, next) => {
    const isAuthenticated = !!localStorage.getItem('token')  // 仅检查存在性

    if (to.meta.requiresAuth && !isAuthenticated) {
        next({ name: 'Login', query: { redirect: to.fullPath } })
    }
    ...
})
```

仅检查token是否存在，不验证其有效性，可能导致：
- 过期token仍可访问受保护页面
- 被篡改的token无法被检测

**建议**:
- 在路由守卫中调用后端验证接口
- 检查token过期时间
- 使用Pinia store管理登录状态

---

## 四、配置问题（低危）

### 4.1 CORS配置格式错误

**文件**: [backend/config/settings.py](file:///e:/Trae/项目物料/backend/config/settings.py)

**问题描述**:
```python
CORS_ORIGINS: str = "http://localhost:5173,http://localhost:8080"
```

`CORSMiddleware`期望`allow_origins`是列表类型，但这里是字符串。

**建议**:
```python
CORS_ORIGINS: list = ["http://localhost:5173", "http://localhost:8080"]
```

---

### 4.2 缺少环境变量配置

**文件**: [backend/.env.example](file:///e:/Trae/项目物料/backend/.env.example)

**问题描述**:
项目存在`.env.example`但缺少实际的`.env`文件，导致使用不安全的默认配置。

**建议**:
- 创建`.env`文件配置生产环境变量
- 在`.gitignore`中添加`.env`规则

---

### 4.3 Redis连接全局变量

**文件**: [backend/config/cache_conf.py](file:///e:/Trae/项目物料/backend/config/cache_conf.py)

**问题描述**:
```python
redis_client = None  # 全局变量

def get_redis_client():
    global redis_client
    if redis_client is None:
        try:
            redis_client = redis.Redis(...)
        except Exception:
            redis_client = None
    return redis_client
```

使用全局变量管理Redis连接存在线程安全问题。

**建议**:
- 使用依赖注入模式
- 初始化连接时添加健康检查
- 配置连接池参数

---

## 五、性能问题（低危）

### 5.1 数据库连接池配置

**文件**: [backend/config/db_conf.py](file:///e:/Trae/项目物料/backend/config/db_conf.py)

**问题描述**:
```python
async_engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,  # 生产环境开启会影响性能
    pool_size=settings.DATABASE_POOL_SIZE,
    max_overflow=settings.DATABASE_MAX_OVERFLOW
)
```

`echo=True`会在控制台打印所有SQL语句，生产环境会严重影响性能。

**建议**:
- 生产环境设置`echo=False`
- 考虑添加连接池回收策略

---

### 5.2 图片代理无缓存机制

**文件**: [backend/routers/image.py](file:///e:/Trae/项目物料/backend/routers/image.py)

**问题描述**:
每次请求都从远程服务器获取图片，没有本地缓存。

**建议**:
- 使用Redis缓存图片内容
- 设置合理的缓存过期时间
- 添加ETag支持

---

## 六、问题汇总

| 优先级 | 类别 | 问题 | 文件 |
| :--- | :--- | :--- | :--- |
| **高危** | 安全 | 硬编码敏感信息（数据库密码、JWT密钥） | settings.py |
| **高危** | 安全 | SSRF漏洞（图片代理接口） | image.py |
| **高危** | 安全 | 密码规则不一致（注册要求过低） | users.py |
| **高危** | 安全 | 前端localStorage存储Token | user.js |
| **中危** | 代码质量 | SHA256不安全哈希算法 | security.py |
| **中危** | 代码质量 | 异常处理过于宽泛 | chat.py |
| **中危** | 代码质量 | 路由守卫不验证Token有效性 | router/index.js |
| **低危** | 配置 | CORS配置格式错误 | settings.py |
| **低危** | 配置 | 缺少环境变量配置 | .env |
| **低危** | 配置 | Redis连接全局变量 | cache_conf.py |
| **低危** | 性能 | 数据库连接池配置 | db_conf.py |
| **低危** | 性能 | 图片代理无缓存机制 | image.py |

## 七、建议修复顺序

1. **第一优先级**：修复硬编码敏感信息和SSRF漏洞
2. **第二优先级**：统一密码规则和Token存储安全
3. **第三优先级**：改进代码质量和配置问题
4. **第四优先级**：优化性能问题
