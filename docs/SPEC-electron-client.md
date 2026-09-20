# SPEC：webterm Electron 桌面客户端（v3 简化版）

> 分支：`feature/electron-client`（基于 main）
> 状态：已确认，实施中（npm 包名与默认地址已定）
> 结论变更：放弃 WSS 隧道方案——现有「浏览器 443 → nginx 反代 → 服务端 backend → SSH」架构中 SSH 流量由服务器本机发起，不经过公司防火墙，WSS 隧道无必要。客户端只做网页包装。

## 1. 目标

- 用 Electron 把现有 webterm 网页包装成**独立桌面应用窗口**，不打包 exe。
- 发布到 npm，`npm install -g` 后任意目录执行 `webterm` 启动。
- 加载地址**可配置**：默认线上地址，支持配置文件/环境变量指向其它 URL（含本地调试地址）。
- **不改动现有 backend / frontend 代码**。

## 2. 架构

```
webterm (npm 全局安装)
  └─ cli.js (bin)
      ├─ 读取配置（~/.webterm/config.json，env 覆盖）
      │    url 默认 https://<线上域名>
      ├─ 单实例锁：已有实例则聚焦其窗口后退出
      └─ Electron 主进程
           └─ BrowserWindow.loadURL(config.url)
                → 现有 nginx 443 反代（公司网络已可达）
```

Electron 内核即 Chromium：页面加载、Cookie、SSE、xterm 渲染与浏览器完全同机制；仅 Cookie 分区独立、无浏览器扩展、自签证书可在主进程统一处理。

## 3. 目录与交付物

| 项 | 位置 |
|---|---|
| 分支 | `feature/electron-client` |
| Electron 主进程 | `desktop/main.js`、`desktop/preload.js`（如需最小桥接） |
| CLI 入口 | `desktop/cli.js` |
| 包定义 | `desktop/package.json`（独立 npm 包：`@alickjoe/webterm`、`bin: { webterm: "cli.js" }`、`files` 仅含 desktop 产物） |
| 文档 | `desktop/README.md`（安装、配置、使用） |

包放在 `desktop/` 子目录独立成包，不污染主仓库根目录；发布时在该目录 `npm publish`。

## 4. 行为细节

- **配置**：`~/.webterm/config.json`（`{ "url": "..." }`），环境变量 `WEBTERM_URL` 优先级更高；首次运行无配置时用内置默认线上地址。
- **窗口**：尺寸/位置记忆到 `~/.webterm/window.json`；全部窗口关闭即退出。
- **单实例**：`app.requestSingleInstanceLock()`，二次启动聚焦已有窗口。
- **加载失败**（断网/VPN 未连）：显示简单重试页，可手动改地址重试。
- **自签证书**：默认严格校验；如公司证书链特殊，提供 `WEBTERM_INSECURE_TLS=1` 逃生开关（文档中标注风险）。
- **安全**：`contextIsolation: true`，不开放 Node 能力给页面（纯展示壳）。

## 5. 不做的事

- 不打包 exe / 安装器 / auto-update（后续需要再说）。
- 不做 WSS 隧道、跳板机、ProxyJump（已评估无必要，见文首结论）。
- 不改 backend / frontend 现有代码。

## 6. 验收标准

1. `npm install -g <包名>` 后执行 `webterm`：弹出应用窗口，加载线上 webterm，可登录、开终端、SFTP，行为与浏览器访问一致。
2. `WEBTERM_URL=http://127.0.0.1:xxxx webterm` 可指向其它地址（如本地起的前端 dev/preview）。
3. 重复执行 `webterm` 只会有一个窗口并被聚焦。
4. 关闭窗口进程完全退出。

## 7. 已确认参数

- npm 包名：`@alickjoe/webterm`
- 默认线上地址：`https://webterm.example.com/`
