#!/usr/bin/env node
'use strict';

/**
 * webterm CLI 入口（bin: webterm）
 *
 * 职责：
 *  1. 基本环境检查（Linux 无图形会话时给出友好报错）；
 *  2. 支持 `webterm <url>` 快速覆盖目标地址（通过 env 传给主进程）；
 *  3. 拉起 Electron 主进程（main.js）并转发退出码。
 *
 * 单实例聚焦逻辑在 Electron 主进程内（requestSingleInstanceLock）。
 */

const { spawn, spawnSync } = require('child_process');
const path = require('path');

function fail(message) {
  console.error(`[webterm] ${message}`);
  process.exit(1);
}

// Linux 无图形会话时 Electron 无法开窗，提前给出可读的错误
if (process.platform === 'linux' && !process.env.DISPLAY && !process.env.WAYLAND_DISPLAY) {
  fail('未检测到图形会话（DISPLAY/WAYLAND_DISPLAY 均为空），无法打开应用窗口。');
}

// require('electron') 在普通 Node 进程中返回 electron 可执行文件路径（字符串）；
// 二进制缺失时会触发懒下载（走公司网/TLS 网关可能失败）
let electronPath;
try {
  electronPath = require('electron');
} catch (err) {
  fail(
    'Electron 运行时缺失或下载失败（常见于公司网络）。\n' +
    '修复方法（PowerShell）：\n' +
    '  1. 公司 TLS 解密网关会重签证书，需让 Node 信任公司根 CA：\n' +
    '     导出根 CA 为 PEM 后：$env:NODE_EXTRA_CA_CERTS="<根CA.pem路径>"\n' +
    '  2. 或改用镜像下载：$env:ELECTRON_MIRROR="https://npmmirror.com/mirrors/electron/"\n' +
    '     然后重新运行 webterm（会自动重试下载）。\n' +
    '详细说明见 README「Windows 企业网络」一节。'
  );
}
if (typeof electronPath !== 'string') {
  fail('electron 依赖未正确安装，请尝试在包目录重新运行 `npm install`。');
}

// Linux：检测 Electron 运行时缺失的系统库，给出发行版安装提示
if (process.platform === 'linux') {
  try {
    const ldd = spawnSync('ldd', [electronPath], { encoding: 'utf8' });
    if (ldd.status === 0 && ldd.stdout) {
      const missing = [...new Set(
        ldd.stdout.split('\n')
          .filter((line) => line.includes('not found'))
          .map((line) => line.trim().split(' ')[0])
          .filter(Boolean)
      )];
      if (missing.length > 0) {
        fail(
          `Electron 缺少系统依赖库：\n  ${missing.join('\n  ')}\n` +
          'Debian/Ubuntu 可执行：\n' +
          '  sudo apt-get install -y libgtk-3-0 libnss3 libasound2 libgl1 \\\n' +
          '    libatk1.0-0 libatk-bridge2.0-0 libatspi2.0-0 libcups2 libgbm1 \\\n' +
          '    libpango-1.0-0 libcairo2 libxcomposite1 libxdamage1 libxfixes3 \\\n' +
          '    libxkbcommon0 libxrandr2\n' +
          'Fedora/RHEL 对应：sudo dnf install gtk3 nss alsa-lib atk at-spi2-atk cups-libs mesa-libgbm pango libXcomposite libXdamage libXfixes libxkbcommon libXrandr'
        );
      }
    }
  } catch {
    // ldd 不存在时跳过检测，交给 Electron 自身报错
  }
}

// `webterm <url>`：位置参数快速覆盖目标地址
const urlArg = process.argv[2];
if (urlArg) {
  process.env.WEBTERM_URL = urlArg;
}

const appDir = __dirname;

const child = spawn(electronPath, [appDir], {
  stdio: 'inherit',
  // 注意：Windows 上不要设 windowsHide:true —— CREATE_NO_WINDOW 会导致
  // Electron 窗口永不显示（进程正常、日志正常但无窗口）。
  // electron.exe 是 GUI 子系统程序，不需要隐藏控制台。
});

child.on('error', (err) => {
  fail(`无法启动 Electron：${err.message}`);
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.exit(0);
  }
  process.exit(code == null ? 0 : code);
});
