# WebTerm

基于浏览器的 Web SSH 终端，支持实时终端交互、SFTP 文件管理和在线代码编辑。

## 功能特性

### SSH 终端
- 基于 XTerm.js 的全功能终端仿真
- Server-Sent Events (SSE) 实时数据流推送
- 终端窗口自适应大小调整
- 可点击链接识别
- Tokyo Night 深色主题，JetBrains Mono / Fira Code 字体
- 输入缓冲批量发送优化（30ms）

### SSH 连接管理
- 保存多个 SSH 连接配置
- 支持密码和 SSH 私钥两种认证方式
- 连接可用性测试（10秒超时）
- 凭证采用 AES-256-GCM 加密存储

### SFTP 文件管理
- 远程目录浏览与导航
- 文件上传（最大 100MB）与下载
- 文件/目录的创建、删除、重命名
- 文件权限、大小、修改时间显示

### 在线文件编辑器
- 基于 CodeMirror 6 的代码编辑器
- 20+ 文件类型语法高亮支持：
  - 配置文件：JSON, YAML, TOML, XML, INI, Nginx, Dockerfile, Shell, .env
  - 编程语言：JavaScript, TypeScript, Python, Go, SQL, HTML, CSS, Markdown
- Prettier 代码格式化（支持 JSON, YAML, JS/TS, HTML, CSS, Markdown 等）
- 行号、代码折叠、括号匹配、自动补全
- 快捷键：`Ctrl+S` 保存，`Ctrl+Shift+F` 格式化，`Esc` 关闭
- 文件大小限制 1MB，自动检测并拒绝二进制文件
- 未保存修改提示

### 用户认证
- 用户注册与登录
- JWT 令牌认证（默认 24 小时有效期）
- bcrypt 密码哈希（12 轮）

### 会话管理
- 单用户最多 5 个并发会话（可配置）
- 会话不活动 30 分钟自动超时（可配置）
- 内存级会话管理，自动资源清理

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端框架 | Vue 3 + TypeScript |
| 状态管理 | Pinia |
| 路由 | Vue Router 4 |
| 构建工具 | Vite 5 |
| 终端仿真 | XTerm.js |
| 代码编辑 | CodeMirror 6 |
| 代码格式化 | Prettier |
| HTTP 客户端 | Axios |
| 后端框架 | Express.js |
| SSH 协议 | ssh2 |
| 数据库 | LevelDB (RocksDB) |
| 数据验证 | Zod |
| 日志 | Pino |
| 安全 | Helmet, JWT, bcrypt, AES-256-GCM |
| 部署 | Docker Compose + Nginx |

## 项目结构

```
webterm/
├── backend/                    # 后端服务
│   └── src/
│       ├── index.ts            # 应用入口
│       ├── app.ts              # Express 配置与中间件
│       ├── config/             # 环境变量配置
│       ├── controllers/        # 请求处理层
│       │   ├── auth.controller.ts
│       │   ├── connections.controller.ts
│       │   ├── terminal.controller.ts
│       │   └── sftp.controller.ts
│       ├── services/           # 业务逻辑层
│       │   ├── auth.service.ts
│       │   ├── crypto.service.ts    # AES-256-GCM 加密
│       │   ├── db.service.ts        # LevelDB 存储
│       │   ├── ssh.service.ts       # SSH/终端会话
│       │   ├── sftp.service.ts      # SFTP 文件操作
│       │   └── logger.service.ts
│       ├── routes/             # API 路由
│       ├── middleware/         # 认证与错误处理中间件
│       └── types/              # TypeScript 类型定义
├── frontend/                   # 前端应用
│   └── src/
│       ├── views/              # 页面组件
│       │   ├── LoginView.vue        # 登录/注册
│       │   ├── DashboardView.vue    # 连接管理仪表板
│       │   ├── WorkspaceView.vue    # 终端 + SFTP 工作区
│       │   └── FileEditorModal.vue  # 文件编辑器
│       ├── composables/        # 组合式函数
│       │   ├── useTerminal.ts       # 终端逻辑
│       │   ├── useSftp.ts           # SFTP 操作
│       │   ├── useFileEditor.ts     # 文件编辑器逻辑
│       │   └── useSSE.ts           # SSE 连接管理
│       ├── api/                # API 调用层
│       ├── stores/             # Pinia 状态管理
│       ├── utils/              # 编辑器语言映射与主题
│       └── router/             # 路由配置
├── nginx/                      # Nginx 反向代理配置
├── docker-compose.yml
└── .env.example
```

## 快速开始

### Docker 部署（推荐）

1. 克隆项目并配置环境变量：

```bash
git clone <repo-url> webterm
cd webterm
cp .env.example .env
```

2. 编辑 `.env`，**必须修改安全相关配置**：

```bash
MASTER_SECRET=<至少32位的随机字符串>
JWT_SECRET=<JWT签名密钥>
```

3. 启动服务：

```bash
docker compose up -d
```

4. 访问 `http://localhost:11112`

### 本地开发

**前置要求：** Node.js 20+

```bash
# 后端
cd backend
npm install
npm run dev

# 前端（新终端）
cd frontend
npm install
npm run dev
```

前端开发服务器默认运行在 `http://localhost:5173`，后端 API 运行在 `http://localhost:3000`。

## 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `MASTER_SECRET` | - | 凭证加密主密钥（生产环境必改，至少 32 字符） |
| `JWT_SECRET` | - | JWT 签名密钥（生产环境必改） |
| `JWT_EXPIRES_IN` | `24h` | JWT 令牌有效期 |
| `MAX_SESSIONS_PER_USER` | `5` | 单用户最大并发会话数 |
| `SESSION_TIMEOUT_MINUTES` | `30` | 会话不活动超时时间（分钟） |
| `CORS_ORIGIN` | `*` | CORS 允许的源 |
| `PORT` | `3000` | 后端服务端口 |
| `NODE_ENV` | - | 运行环境（`production` / `development`） |
| `ROCKSDB_PATH` | `/app/data/rocksdb` | 数据库存储路径 |

## 架构概览

```
浏览器
  │
  ├── Vue 3 SPA ──── XTerm.js (终端)
  │                   CodeMirror 6 (编辑器)
  │
  ▼
Nginx (反向代理, :80)
  │
  ├── /          → 静态文件 (前端构建产物)
  ├── /api       → 代理到后端 (:3000)
  └── /api/terminal/sessions/*/stream → SSE 长连接 (24h 超时)
  │
  ▼
Express.js 后端 (:3000)
  │
  ├── JWT 认证中间件
  ├── SSH/SFTP 会话管理 (内存)
  ├── LevelDB 持久化存储 (用户、连接配置)
  └── ssh2 → 远程 SSH 服务器
```

## API 概览

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/register` | 用户注册 |
| POST | `/api/auth/login` | 用户登录 |
| GET | `/api/auth/me` | 获取当前用户 |
| GET | `/api/connections` | 列出所有连接 |
| POST | `/api/connections` | 创建连接 |
| PUT | `/api/connections/:id` | 更新连接 |
| DELETE | `/api/connections/:id` | 删除连接 |
| POST | `/api/connections/:id/test` | 测试连接 |
| POST | `/api/terminal/sessions` | 创建终端会话 |
| GET | `/api/terminal/sessions/:id/stream` | SSE 终端输出流 |
| POST | `/api/terminal/sessions/:id/input` | 发送终端输入 |
| POST | `/api/terminal/sessions/:id/resize` | 调整终端大小 |
| DELETE | `/api/terminal/sessions/:id` | 关闭终端会话 |
| POST | `/api/sftp/sessions` | 创建 SFTP 会话 |
| GET | `/api/sftp/sessions/:id/list` | 列出目录 |
| GET | `/api/sftp/sessions/:id/download` | 下载文件 |
| POST | `/api/sftp/sessions/:id/upload` | 上传文件 |
| DELETE | `/api/sftp/sessions/:id/file` | 删除文件/目录 |
| POST | `/api/sftp/sessions/:id/mkdir` | 创建目录 |
| POST | `/api/sftp/sessions/:id/rename` | 重命名 |
| GET | `/api/sftp/sessions/:id/file/content` | 读取文件内容（编辑） |
| PUT | `/api/sftp/sessions/:id/file/content` | 保存文件内容（编辑） |
| DELETE | `/api/sftp/sessions/:id` | 关闭 SFTP 会话 |
| GET | `/api/health` | 健康检查 |

## 安全说明

- 用户密码使用 bcrypt（12 轮）哈希存储
- SSH 密码和私钥使用 AES-256-GCM 加密，密钥通过 HKDF-SHA256 从主密钥派生（每用户唯一）
- 所有 API 请求通过 JWT Bearer Token 认证
- 会话级资源隔离，每个用户只能访问自己的连接和会话
- Helmet.js 安全头部中间件
- 文件编辑器拒绝二进制文件，限制文件大小为 1MB
- 文件上传限制为 100MB

## License

MIT
