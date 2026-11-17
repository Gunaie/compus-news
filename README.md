# 校园资讯平台

基于 Vue3 + FastAPI 构建的现代化校园资讯平台，提供新闻浏览、用户认证、收藏管理、历史记录和 AI 问答等功能。

## 技术栈

### 前端
- **框架**: Vue 3 (Composition API) + Vite 原生 SSR
- **构建工具**: Vite 7 + Express SSR 服务
- **UI 组件库**: Vant 4
- **性能**: 路由懒加载、动态高度虚拟列表、响应式 WebP、可选 CDN
- **质量**: Playwright E2E、Lighthouse CI、Web Vitals 与异常监控
- **状态管理**: Pinia
- **路由**: Vue Router 4
- **国际化**: Vue I18n 9
- **HTTP 客户端**: Axios

### 后端
- **框架**: FastAPI
- **ORM**: SQLAlchemy 2.0 (异步)
- **数据库**: MySQL (aiomysql)
- **缓存**: Redis
- **认证**: JWT (python-jose)
- **限流**: slowapi + limits
- **异步 HTTP**: httpx

### 部署
- **容器化**: Docker + Docker Compose
- **反向代理**: Nginx

## 项目结构

```
.
├── backend/                    # FastAPI 后端
│   ├── cache/                  # 缓存模块
│   ├── config/                 # 数据库、Redis 与环境配置
│   ├── crud/                   # 数据访问层
│   ├── models/                 # SQLAlchemy 模型
│   ├── routers/                # API 路由
│   ├── schemas/                # 数据校验模型
│   ├── tests/                  # pytest 测试
│   ├── utils/                  # 认证、日志、限流等工具
│   ├── main.py                 # 应用入口
│   ├── run_sql.py              # 数据库与示例数据初始化工具
│   ├── pyproject.toml          # Python 项目与依赖配置
│   ├── requirements.txt        # 由 uv.lock 导出的生产依赖
│   └── uv.lock                 # Python 依赖锁文件
│
├── frontend/                   # Vue 3 + Vite 前端
│   ├── e2e/                    # Playwright 测试与确定性 fixture 服务
│   ├── src/
│   │   ├── api/                # API 请求封装
│   │   ├── components/         # 新闻卡片与虚拟列表
│   │   ├── i18n/               # 国际化配置
│   │   ├── router/             # 路由、预取与鉴权
│   │   ├── store/              # Pinia 状态管理
│   │   ├── utils/              # 图片等工具函数
│   │   ├── views/              # 页面组件
│   │   ├── entry-client.js     # 浏览器水合与 CSR 入口
│   │   ├── entry-server.js     # SSR 渲染入口
│   │   ├── monitor.js          # Web Vitals 与异常监控
│   │   └── seo.js              # SEO 元信息
│   ├── server.js               # Express SSR 服务
│   ├── lighthouserc.cjs        # Lighthouse 三次中位数门槛
│   ├── playwright.config.js    # E2E 配置
│   └── package.json            # 前端依赖与命令
│
├── docs/
│   ├── database.sql            # 数据库建表脚本
│   └── campus_data.sql         # 分类与新闻示例数据
├── scripts/smoke.mjs           # 部署发布冒烟
├── .env.example                # Compose 环境变量示例
├── docker-compose.yml          # 五服务部署配置
├── LICENSE                     # MIT 许可证
├── Makefile                    # 快捷命令
└── README.md                   # 项目说明
```

## 功能特性

### 核心功能
- **新闻浏览**: 首页展示新闻列表，支持分类筛选和下拉刷新
- **新闻详情**: 查看完整新闻内容，支持收藏和分享
- **用户认证**: 注册、登录、密码验证，基于 JWT 令牌机制
- **收藏管理**: 收藏喜欢的新闻，支持取消收藏和清空
- **浏览历史**: 自动记录浏览过的新闻，支持删除和清空
- **个人中心**: 修改个人资料、头像，查看用户信息
- **AI 问答**: 集成 AI 聊天功能，支持智能问答

### 技术特性
- **国际化**: 支持中文/英文双语切换
- **图片代理**: 解决跨域图片加载问题
- **请求限流**: 防止 API 滥用
- **全局日志**: 统一日志管理和请求追踪
- **错误处理**: 统一的异常处理和友好的错误提示
- **路由守卫**: 基于登录状态的路由访问控制

## 快速开始

### 环境要求
- Python 3.14.x（与 `.python-version`、Docker 镜像一致）
- Node.js >= 20.19（Vite 7 要求，Docker 使用 Node 20）
- MySQL >= 8.0
- Redis >= 6.0
- Docker (可选，用于容器化部署)

### 本地开发

#### 1. 安装依赖

**后端依赖 (使用 uv 包管理器)**:
```bash
cd backend
uv sync
```

**前端依赖**:
```bash
cd frontend
npm ci
```

#### 2. 配置环境

**后端配置**:
```bash
cd backend
cp .env.example .env
```

编辑 `.env` 文件，配置数据库连接等参数：
```env
DEBUG=True

DATABASE_URL=mysql+aiomysql://root:replace-with-your-mysql-password@localhost:3306/news_app?charset=utf8mb4
DATABASE_POOL_SIZE=10
DATABASE_MAX_OVERFLOW=20

REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0

JWT_SECRET_KEY=replace-with-at-least-32-bytes-of-random-data
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30
JWT_REFRESH_TOKEN_EXPIRE_DAYS=7

CORS_ORIGINS=["http://localhost:5173","http://localhost:5175","http://localhost:8080"]

DASHSCOPE_API_KEY=
DASHSCOPE_API_URL=https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions
DASHSCOPE_MODEL=kimi-k2.6

RATE_LIMIT_STORAGE_URL=redis://localhost:6379/1
```

**前端配置**:

```bash
cd frontend
cp .env.example .env
```

可用配置：
```env
# 浏览器 API 地址；默认同源，由 SSR 服务代理 /api
VITE_API_BASE_URL=
# 可选图片 CDN 前缀；留空表示未启用外部 CDN
VITE_IMAGE_CDN_BASE_URL=
# Web Vitals 与异常上报采样率，范围 0~1
VITE_MONITOR_SAMPLE_RATE=0.1
```

SSR 服务默认代理到 `http://localhost:8888`。需要修改时，在启动环境中设置 `API_INTERNAL_BASE_URL`；公网站点通过 `APP_ORIGIN` 生成 canonical 和 Open Graph URL。

#### 3. 启动服务

**启动后端**:
```bash
cd backend
uv run uvicorn main:app --host 0.0.0.0 --port 8888 --reload
```

**启动前端**:
```bash
cd frontend
npm run dev
```

访问地址：
- 前端页面: http://localhost:5175
- 后端 API: http://localhost:8888
- API 文档: http://localhost:8888/docs

### Docker 部署

部署包含 Nginx 网关、Node SSR、FastAPI、MySQL 和 Redis。首次启动会执行 `docs/database.sql` 建表，再导入 `docs/campus_data.sql` 示例数据。`MYSQL_ROOT_PASSWORD` 与 `JWT_SECRET_KEY` 均为必填项且不能为空；JWT 密钥应使用至少 32 字节的随机数据。MySQL、Redis 和后端端口仅绑定 `127.0.0.1`，公网流量只通过 Nginx 网关进入。

```bash
cp .env.example .env
# 修改生产密码、JWT 密钥和 APP_ORIGIN 后执行
docker compose up -d --build
node scripts/smoke.mjs
```

也可以使用 `make deploy`。常用命令：

```bash
docker compose ps                 # 服务及健康状态
docker compose logs -f            # JSON 请求与应用日志
docker compose down               # 停止服务
```

- 站点：`http://localhost:8080`
- SSR 健康检查：`GET /healthz`
- 后端就绪检查：`GET /api/health/ready`，实际检查 MySQL 与 Redis
- 客户端监控：`POST /api/metrics`，按采样率上报 LCP、CLS、INP、FCP、TTFB 和异常
- 日志由 Docker `json-file` 驱动轮转，单文件 10 MB，保留 3 份

`VITE_IMAGE_CDN_BASE_URL` 仅在配置有效 CDN 域名后生效；默认留空，图片经后端代理实时转为 WebP，不代表已接入第三方 CDN。

## API 接口

主要接口如下，具体请求参数以 `backend/routers/` 和 `backend/schemas/` 中的实际定义为准。

### 用户管理模块
| 方法 | 路径 | 描述 |
|------|------|------|
| POST | `/api/user/register` | 用户注册 |
| POST | `/api/user/login` | 用户登录 |
| GET | `/api/user/info` | 获取用户信息 |
| PUT | `/api/user/update` | 更新用户信息 |
| PUT | `/api/user/password` | 修改用户密码 |

### 新闻模块
| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/news/categories` | 获取新闻分类列表 |
| GET | `/api/news/list` | 获取新闻列表 |
| GET | `/api/news/detail` | 获取新闻详情 |

### 收藏模块
| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/favorite/check` | 检查新闻收藏状态 |
| POST | `/api/favorite/add` | 添加收藏 |
| DELETE | `/api/favorite/remove` | 取消收藏 |
| GET | `/api/favorite/list` | 获取收藏列表 |
| DELETE | `/api/favorite/clear` | 清空所有收藏 |

### 浏览历史模块
| 方法 | 路径 | 描述 |
|------|------|------|
| POST | `/api/history/add` | 添加浏览记录 |
| GET | `/api/history/list` | 获取浏览历史列表 |
| DELETE | `/api/history/delete/{history_id}` | 删除单条浏览记录 |
| DELETE | `/api/history/clear` | 清空浏览历史 |

### 其他接口
| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/image/proxy?url=xxx` | 图片代理 |
| POST | `/api/chat/completion` | AI 问答 |
| GET | `/api/health` | 后端存活检查 |
| GET | `/api/health/ready` | 数据库与 Redis 就绪检查 |
| POST | `/api/metrics` | 接收 Web Vitals 与异常事件 |

## 数据库初始化

配置后端 `.env` 中的 `DATABASE_URL` 后，可一次执行建表和示例数据导入：

```bash
cd backend
uv run python run_sql.py
```

也可以在项目根目录直接导入 SQL 文件：

```bash
mysql -u username -p < docs/database.sql
mysql -u username -p news_app < docs/campus_data.sql
```

以上方式都会清空并重新导入分类和新闻示例数据，请勿用于包含业务数据的数据库。

## 测试

```bash
# 后端单元测试
cd backend && uv run pytest tests/ -v

# 前端生产构建及 Playwright E2E（SSR、鉴权、水合、虚拟列表）
cd frontend && npm run test:e2e

# 首页与详情各运行 3 次 Lighthouse，按中位数断言
cd frontend && npm run test:perf

# 对部署环境执行发布冒烟
cd .. && node scripts/smoke.mjs
```

Lighthouse 使用移动模拟，要求 Performance、Best Practices、SEO 中位数均不低于 0.90，LCP 不高于 2.5 秒，CLS 不高于 0.1。报告保存在 `frontend/lighthouse-report/`，Playwright 报告保存在 `frontend/playwright-report/`。

2026-11-17 使用生产构建实测，首页和详情各运行 3 次，中位数如下：

| 页面 | Performance | Best Practices | SEO | LCP | CLS |
| --- | --- | --- | --- | --- | --- |
| 首页 | 0.98 | 0.96 | 1.00 | 2073 ms | 0 |
| 新闻详情 | 0.96 | 0.96 | 1.00 | 2355 ms | 0 |

同一轮验收中，Playwright 11 项、后端 pytest 37 项及 Docker 发布冒烟均通过。

## 项目约定

### 前端
- 组件命名使用 PascalCase
- API 请求统一封装在 `src/api/index.js`
- 状态管理使用 Pinia，存储在 `src/store/`
- 路由配置在 `src/router/index.js`
- 国际化配置在 `src/i18n/index.js`

### 后端
- 路由文件在 `routers/`，一个文件对应一个模块
- 数据模型在 `models/`，使用 SQLAlchemy 声明式语法
- 数据校验在 `schemas/`，使用 Pydantic
- CRUD 操作在 `crud/`，封装数据库操作
- 工具函数在 `utils/`，包含认证、日志、异常处理等

## 开发规范

### 代码风格
- Python 使用 PEP 8 规范
- JavaScript/TypeScript 使用 ESLint
- 代码提交使用 Conventional Commits 规范

### 安全规范
- 密码使用 bcrypt 加密存储
- API Key 只存储在后端环境变量中
- JWT 令牌设置合理的过期时间（默认 30 分钟）
- 所有输入参数进行校验
- 请求限流防止 API 滥用

### 性能优化
- 首页与详情 SSR 直出，路由级 CSS 随首屏返回，私有与访客页面保持 CSR
- 公开数据在水合前预取，避免首屏重复请求
- 首页使用支持动态高度的 window scrolling 虚拟列表
- 图片实时转 WebP，提供响应式 `srcset`、固定尺寸和可选 CDN
- 路由懒加载、静态资源长期缓存、SSR 与 Nginx Gzip
- 新闻列表使用 Redis 缓存机制，数据库使用连接池

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！
