# 校园资讯平台

基于 Vue3 + FastAPI 构建的现代化校园资讯平台，提供新闻浏览、用户认证、收藏管理、历史记录和 AI 问答等功能。

## 技术栈

### 前端
- **框架**: Vue 3 (Composition API)
- **构建工具**: Vite 7
- **UI 组件库**: Vant 4
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
├── backend/                    # 后端项目
│   ├── crud/                   # 数据访问层
│   ├── models/                 # 数据库模型
│   ├── routers/                # API 路由
│   ├── schemas/                # 数据校验模型
│   ├── utils/                  # 工具函数
│   ├── config/                 # 配置文件
│   ├── cache/                  # 缓存模块
│   ├── tests/                  # 单元测试
│   ├── main.py                 # 入口文件
│   ├── pyproject.toml          # Python 项目配置
│   └── requirements.txt        # 依赖列表
│
├── frontend/                   # 前端项目
│   ├── src/
│   │   ├── api/                # API 请求封装
│   │   ├── i18n/               # 国际化配置
│   │   ├── router/             # 路由配置
│   │   ├── store/              # Pinia 状态管理
│   │   ├── views/              # 页面组件
│   │   ├── App.vue             # 根组件
│   │   ├── main.js             # 入口文件
│   │   └── style.css           # 全局样式
│   ├── index.html              # HTML 模板
│   ├── vite.config.js          # Vite 配置
│   └── package.json            # 前端依赖
│
├── docs/                       # 项目文档
│   ├── API接口规范文档.md       # API 接口详细文档
│   ├── 项目后端设计说明文档.md  # 后端设计说明
│   ├── database.sql            # 数据库初始化脚本
│   └── campus_data.sql         # 校园数据脚本
│
├── docker-compose.yml          # Docker Compose 配置
├── Makefile                    # 快捷命令
└── .gitignore                  # Git 忽略配置
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
- Python >= 3.14 (项目配置要求，实际可根据依赖版本调整)
- Node.js >= 18
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
npm install --registry=https://registry.npmmirror.com
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

DATABASE_URL=mysql+aiomysql://root:12345678@localhost:3306/news_app?charset=utf8mb4
DATABASE_POOL_SIZE=10
DATABASE_MAX_OVERFLOW=20

REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0

JWT_SECRET_KEY=campus-news-jwt-secret-key-change-in-production
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30
JWT_REFRESH_TOKEN_EXPIRE_DAYS=7

CORS_ORIGINS=http://localhost:5173,http://localhost:5175,http://localhost:8080

DASHSCOPE_API_KEY=
DASHSCOPE_API_URL=https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions
DASHSCOPE_MODEL=kimi-k2.6

RATE_LIMIT_STORAGE_URL=redis://localhost:6379/1
```

**前端配置**:

前端使用 Vite 代理，配置在 `vite.config.js` 中：
```javascript
server: {
  host: '0.0.0.0',
  port: 5175,
  strictPort: true,
  proxy: {
    '/api': {
      target: 'http://localhost:8888',
      changeOrigin: true
    }
  }
}
```

#### 3. 启动服务

**启动后端**:
```bash
cd backend
uvicorn main:app --host 0.0.0.0 --port 8888 --reload
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

**启动所有服务**:
```bash
docker-compose up -d
```

**查看服务状态**:
```bash
docker-compose ps
```

**停止服务**:
```bash
docker-compose down
```

## API 接口

完整的 API 接口文档请参考 [API接口规范文档.md](docs/API接口规范文档.md)。

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
| GET | `/api/health` | 健康检查 |

## 数据库初始化

执行数据库初始化脚本：
```bash
cd backend
python run_sql.py
```

或直接导入 SQL 文件：
```bash
mysql -u username -p database < docs/database.sql
mysql -u username -p database < docs/campus_data.sql
```

## 测试

运行后端测试：
```bash
cd backend
uv run pytest
```

## 项目文档

- [API接口规范文档.md](docs/API接口规范文档.md) - API 接口详细说明
- [项目后端设计说明文档.md](docs/项目后端设计说明文档.md) - 后端架构设计

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
- 新闻列表使用 Redis 缓存机制
- 图片懒加载
- API 请求合并和防抖
- 使用连接池管理数据库连接

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！
