#!/usr/bin/env node
'use strict';

/**
 * @alickjoe/webterm postinstall：把 Electron 运行时下载合并进 npm install 阶段。
 *
 * 背景：electron@44 官方包不再带 postinstall 自动下载（scripts 为空），
 * 默认体验是"装完之后第一次运行才下载"。这里在 install 阶段 require('electron')
 * 主动触发一次下载（electron 的 index.js 会在二进制缺失时阻塞式下载）。
 *
 * 设计原则：
 *  - 下载失败【不阻断】npm install：懒下载仍会在首次运行 webterm 时兜底；
 *  - 同版本二进制有 @electron/get 用户级缓存（Windows %LOCALAPPDATA%\electron\Cache、
 *    Linux/macOS ~/.electron 或 ~/.cache），升级重装时仅解压不重新联网下载。
 *
 * 企业网络失败时的两个关键环境变量（详见 README）：
 *  - NODE_EXTRA_CA_CERTS  让 Node 的 fetch 信任公司 TLS 解密网关重签的证书
 *  - ELECTRON_MIRROR      换下载镜像，如 https://npmmirror.com/mirrors/electron/
 */

const fs = require('fs');

let binaryPath = null;
try {
  // 普通 Node 进程中 require('electron') 返回二进制路径字符串；
  // 若二进制缺失会触发 electron 内置的阻塞式下载，失败则抛错。
  const p = require('electron');
  if (typeof p === 'string' && fs.existsSync(p)) {
    binaryPath = p;
  }
} catch (err) {
  // 落到下面的警告分支
}

if (binaryPath) {
  console.log('[webterm] Electron 运行时就绪 ✓');
  process.exit(0);
}

console.warn('[webterm] Electron 运行时未就绪：本次安装没有下载成功。');
console.warn('[webterm] 不影响安装完成——首次运行 webterm 时会自动重试下载。');
console.warn('[webterm] 公司网络下载失败时，请在运行前设置（详见 README「Windows 企业网络」）：');
console.warn('[webterm]   NODE_EXTRA_CA_CERTS=<公司根CA.pem>  ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/');
process.exit(0);
