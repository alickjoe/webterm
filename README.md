# WebTerm

基于浏览器的 Web SSH 终端，支持实时终端交互、SFTP 文件管理和在线代码编辑。

A browser-based Web SSH terminal with real-time terminal interaction, SFTP file management, and online code editing.

---

## 功能特性 / Features

### 多主机连接
- 同时连接多个 SSH 主机
- 浏览器标签页风格的多主机切换
- 切换主机时不中断现有会话
- 每个主机独立的终端和 SFTP 工作区
- 从仪表板添加新连接，即时切换到工作区

### SFTP 文件管理
- 远程目录浏览与导航
- 文件上传（最大 100MB）与下载
- 文件/目录的创建、删除、重命名
- 文件权限、大小、修改时间显示

### SSH 连接管理 / SSH Connection Management
- 保存多个 SSH 连接配置 / Save multiple SSH connection profiles
- 支持密码和 SSH 私钥两种认证方式 / Password and SSH private key authentication
- 连接可用性测试（10秒超时） / Connection testing with 10s timeout
- 凭证采用 AES-256-GCM 加密存储 / Credentials encrypted with AES-256-GCM

### SFTP 文件管理 / SFTP File Management
- 远程目录浏览与导航 / Remote directory browsing and navigation
- 文件上传（最大 100MB）与下载 / File upload (up to 100MB) and download
- 文件/目录的创建、删除、重命名 / Create, delete, and rename files/directories
- 文件权限、大小、修改时间显示 / Display file permissions, size, and modification time

### 在线文件编辑器 / Online File Editor
- 基于 CodeMirror 6 的代码编辑器 / Code editor powered by CodeMirror 6
- 20+ 文件类型语法高亮支持 / Syntax highlighting for 20+ file types:
  - 配置文件 / Config files: JSON, YAML, TOML, XML, INI, Nginx, Dockerfile, Shell, .env
  - 编程语言 / Programming languages: JavaScript, TypeScript, Python, Go, SQL, HTML, CSS, Markdown
- Prettier 代码格式化（支持 JSON, YAML, JS/TS, HTML, CSS, Markdown 等） / Prettier code formatting (JSON, YAML, JS/TS, HTML, CSS, Markdown, etc.)
- 行号、代码折叠、括号匹配、自动补全 / Line numbers, code folding, bracket matching, auto-completion
- 快捷键 / Keyboard shortcuts: `Ctrl+S` 保存/save, `Ctrl+Shift+F` 格式化/format, `Esc` 关闭/close
- 文件大小限制 1MB，自动检测并拒绝二进制文件 / 1MB file size limit, auto-detection and rejection of binary files
- 未保存修改提示 / Unsaved changes warning

### 用户认证 / User Authentication
- 用户注册与登录 / User registration and login
- JWT 令牌认证（默认 24 小时有效期） / JWT token authentication (24h expiry by default)
- bcrypt 密码哈希（12 轮） / bcrypt password hashing (12 rounds)

### 会话管理 / Session Management
- 单用户最多 5 个并发会话（可配置） / Up to 5 concurrent sessions per user (configurable)
- 会话不活动 30 分钟自动超时（可配置） / 30-minute inactivity timeout (configurable)
- 内存级会话管理，自动资源清理 / In-memory session management with automatic cleanup

## 技术栈 / Tech Stack

| 层级 / Layer | 技术 / Technology |
|------|------|
| 前端框架 / Frontend | Vue 3 + TypeScript |
| 状态管理 / State | Pinia |
| 路由 / Routing | Vue Router 4 |
| 构建工具 / Build | Vite 5 |
| 终端仿真 / Terminal | XTerm.js |
| 代码编辑 / Editor | CodeMirror 6 |
| 代码格式化 / Formatter | Prettier |
| HTTP 客户端 / HTTP Client | Axios |
| 后端框架 / Backend | Express.js |
| SSH 协议 / SSH | ssh2 |
| 数据库 / Database | LevelDB (RocksDB) |
| 数据验证 / Validation | Zod |
| 日志 / Logging | Pino |
| 安全 / Security | Helmet, JWT, bcrypt, AES-256-GCM |
| 部署 / Deployment | Docker Compose + Nginx |

## 项目结构 / Project Structure

```
webterm/
├── backend/                    # 后端服务 / Backend service
│   └── src/
│       ├── index.ts            # 应用入口 / App entry
│       ├── app.ts              # Express 配置与中间件 / Express config & middleware
│       ├── config/             # 环境变量配置 / Environment config
│       ├── controllers/        # 请求处理层 / Request handlers
│       │   ├── auth.controller.ts
│       │   ├── connections.controller.ts
│       │   ├── terminal.controller.ts
│       │   └── sftp.controller.ts
│       ├── services/           # 业务逻辑层 / Business logic
│       │   ├── auth.service.ts
│       │   ├── crypto.service.ts    # AES-256-GCM 加密 / Encryption
│       │   ├── db.service.ts        # LevelDB 存储 / Storage
│       │   ├── ssh.service.ts       # SSH/终端会话 / SSH/terminal sessions
│       │   ├── sftp.service.ts      # SFTP 文件操作 / SFTP file ops
│       │   └── logger.service.ts
│       ├── routes/             # API 路由 / API routes
│       ├── middleware/         # 认证与错误处理中间件 / Auth & error middleware
│       └── types/              # TypeScript 类型定义 / Type definitions
├── frontend/                   # 前端应用 / Frontend app
│   └── src/
│       ├── views/              # 页面组件
│       │   ├── LoginView.vue        # 登录/注册
│       │   ├── DashboardView.vue    # 连接管理仪表板
│       │   ├── WorkspaceView.vue    # 多主机工作区（标签管理）
│       │   ├── ConnectionPanel.vue  # 单主机连接面板
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

## 快速开始 / Quick Start

### Docker 部署（推荐） / Docker Deployment (Recommended)

1. 克隆项目并配置环境变量 / Clone and configure environment:

```bash
git clone <repo-url> webterm
cd webterm
cp .env.example .env
```

2. 编辑 `.env`，**必须修改安全相关配置** / Edit `.env`, **must change security settings**:

```bash
MASTER_SECRET=<至少32位的随机字符串 / random string, at least 32 chars>
JWT_SECRET=<JWT签名密钥 / JWT signing secret>
```

3. 启动服务 / Start services:

```bash
docker compose up -d
```

4. 访问 / Visit `http://localhost:11112`

### 本地开发 / Local Development

**前置要求 / Prerequisites:** Node.js 20+

```bash
# 后端 / Backend
cd backend
npm install
npm run dev

# 前端（新终端） / Frontend (new terminal)
cd frontend
npm install
npm run dev
```

前端开发服务器默认运行在 `http://localhost:5173`，后端 API 运行在 `http://localhost:3000`。

Frontend dev server runs at `http://localhost:5173`, backend API at `http://localhost:3000`.

## 环境变量 / Environment Variables

| 变量 / Variable | 默认值 / Default | 说明 / Description |
|------|--------|------|
| `MASTER_SECRET` | - | 凭证加密主密钥，至少 32 字符 / Master encryption key, min 32 chars |
| `JWT_SECRET` | - | JWT 签名密钥 / JWT signing secret |
| `JWT_EXPIRES_IN` | `24h` | JWT 令牌有效期 / JWT token expiry |
| `MAX_SESSIONS_PER_USER` | `5` | 单用户最大并发会话数 / Max concurrent sessions per user |
| `SESSION_TIMEOUT_MINUTES` | `30` | 会话不活动超时（分钟） / Session inactivity timeout (minutes) |
| `CORS_ORIGIN` | `*` | CORS 允许的源 / Allowed CORS origins |
| `PORT` | `3000` | 后端服务端口 / Backend service port |
| `NODE_ENV` | - | 运行环境 / Runtime environment (`production` / `development`) |
| `ROCKSDB_PATH` | `/app/data/rocksdb` | 数据库存储路径 / Database storage path |

## 架构概览 / Architecture Overview

```
Browser (浏览器)
  │
  ├── Vue 3 SPA ──── XTerm.js (终端) x N
  │                   CodeMirror 6 (编辑器)
  │                   多主机 Tab 管理 (Pinia)
  │
  ▼
Nginx (反向代理 / Reverse Proxy, :80)
  │
  ├── /          → 静态文件 / Static files (frontend build)
  ├── /api       → 代理到后端 / Proxy to backend (:3000)
  └── /api/terminal/sessions/*/stream → SSE 长连接 / SSE long-lived connection (24h timeout)
  │
  ▼
Express.js Backend (后端, :3000)
  │
  ├── JWT 认证中间件 / JWT auth middleware
  ├── SSH/SFTP 会话管理 / SSH/SFTP session management (in-memory)
  ├── LevelDB 持久化存储 / LevelDB persistent storage (users, connections)
  └── ssh2 → 远程 SSH 服务器 / Remote SSH servers
```

## API 概览 / API Reference

### 认证 / Authentication

| 方法 / Method | 路径 / Path | 说明 / Description |
|------|------|------|
| POST | `/api/auth/register` | 用户注册 / Register |
| POST | `/api/auth/login` | 用户登录 / Login |
| GET | `/api/auth/me` | 获取当前用户 / Get current user |

### 连接管理 / Connection Management

| 方法 / Method | 路径 / Path | 说明 / Description |
|------|------|------|
| GET | `/api/connections` | 列出所有连接 / List all connections |
| POST | `/api/connections` | 创建连接 / Create connection |
| PUT | `/api/connections/:id` | 更新连接 / Update connection |
| DELETE | `/api/connections/:id` | 删除连接 / Delete connection |
| POST | `/api/connections/:id/test` | 测试连接 / Test connection |

### 终端 / Terminal

| 方法 / Method | 路径 / Path | 说明 / Description |
|------|------|------|
| POST | `/api/terminal/sessions` | 创建终端会话 / Create terminal session |
| GET | `/api/terminal/sessions/:id/stream` | SSE 终端输出流 / SSE terminal output stream |
| POST | `/api/terminal/sessions/:id/input` | 发送终端输入 / Send terminal input |
| POST | `/api/terminal/sessions/:id/resize` | 调整终端大小 / Resize terminal |
| DELETE | `/api/terminal/sessions/:id` | 关闭终端会话 / Close terminal session |

### SFTP

| 方法 / Method | 路径 / Path | 说明 / Description |
|------|------|------|
| POST | `/api/sftp/sessions` | 创建 SFTP 会话 / Create SFTP session |
| GET | `/api/sftp/sessions/:id/list` | 列出目录 / List directory |
| GET | `/api/sftp/sessions/:id/download` | 下载文件 / Download file |
| POST | `/api/sftp/sessions/:id/upload` | 上传文件 / Upload file |
| DELETE | `/api/sftp/sessions/:id/file` | 删除文件/目录 / Delete file/directory |
| POST | `/api/sftp/sessions/:id/mkdir` | 创建目录 / Create directory |
| POST | `/api/sftp/sessions/:id/rename` | 重命名 / Rename |
| GET | `/api/sftp/sessions/:id/file/content` | 读取文件内容 / Read file content (editor) |
| PUT | `/api/sftp/sessions/:id/file/content` | 保存文件内容 / Write file content (editor) |
| DELETE | `/api/sftp/sessions/:id` | 关闭 SFTP 会话 / Close SFTP session |

### 其他 / Other

| 方法 / Method | 路径 / Path | 说明 / Description |
|------|------|------|
| GET | `/api/health` | 健康检查 / Health check |

## 安全说明 / Security

- 用户密码使用 bcrypt（12 轮）哈希存储 / User passwords hashed with bcrypt (12 rounds)
- SSH 密码和私钥使用 AES-256-GCM 加密，密钥通过 HKDF-SHA256 从主密钥派生（每用户唯一） / SSH passwords and private keys encrypted with AES-256-GCM, keys derived via HKDF-SHA256 from master secret (per-user unique)
- 所有 API 请求通过 JWT Bearer Token 认证 / All API requests authenticated via JWT Bearer Token
- 会话级资源隔离，每个用户只能访问自己的连接和会话 / Session-level resource isolation, users can only access their own connections and sessions
- Helmet.js 安全头部中间件 / Helmet.js security headers middleware
- 文件编辑器拒绝二进制文件，限制文件大小为 1MB / File editor rejects binary files, 1MB size limit
- 文件上传限制为 100MB / File upload limited to 100MB

## License

MIT
