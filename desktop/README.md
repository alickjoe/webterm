# @alickjoe/webterm

webterm 桌面客户端：用 Electron 把 webterm 网页包装成独立应用窗口（纯展示壳，不打包 exe/安装器）。

内核即 Chromium，页面加载、Cookie、SSE、终端渲染与浏览器访问完全一致；仅 Cookie 分区独立、无浏览器扩展。

## 安装

```bash
npm install -g @alickjoe/webterm
```

> 注意：首次安装会下载 Electron 运行时（约 100MB），请耐心等待。
> 发布 scoped 包需要 `npm publish --access public`。

### Linux 系统依赖

Electron 需要 GTK/NSS 等系统库（缺失时 `webterm` 启动会自动检测并提示）。Debian/Ubuntu 手动安装：

```bash
sudo apt-get install -y libgtk-3-0 libnss3 libasound2 \
  libatk1.0-0 libatk-bridge2.0-0 libatspi2.0-0 libcups2 libgbm1 \
  libpango-1.0-0 libcairo2 libxcomposite1 libxdamage1 libxfixes3 \
  libxkbcommon0 libxrandr2
```

Fedora/RHEL：

```bash
sudo dnf install gtk3 nss alsa-lib atk at-spi2-atk cups-libs mesa-libgbm pango libXcomposite libXdamage libXfixes libxkbcommon libXrandr
```

## 使用

```bash
# 默认加载 https://webterm.example.com/
webterm

# 临时指向其它地址（优先级最高）
webterm http://127.0.0.1:3300/
```

## 配置

目标地址优先级：**命令行参数 > 环境变量 `WEBTERM_URL` > `~/.webterm/config.json` > 内置默认值**。

修改默认地址，创建 `~/.webterm/config.json`：

```json
{ "url": "https://webterm.example.com/" }
```

其它环境变量：

| 变量 | 说明 |
|---|---|
| `WEBTERM_URL` | 覆盖目标地址 |
| `WEBTERM_INSECURE_TLS=1` | 跳过 TLS 证书校验（仅公司自签证书链特殊时使用，有安全风险） |

窗口尺寸/位置自动记忆到 `~/.webterm/window.json`。

## 行为说明

- 单实例：重复执行 `webterm` 会聚焦已打开的窗口，不会开出第二个。
- 断网/VPN 未连时显示内置重试页，可一键重试。
- 页面里的外部链接（非 webterm 同源）会在系统默认浏览器打开。
- 关闭窗口即完全退出。

## 开发

```bash
cd desktop
npm install
npm start            # electron .
```

发布到 npm：

```bash
npm pack --dry-run   # 检查包内容
npm publish --access public
```
