'use strict';

/**
 * webterm Electron 主进程（纯展示壳）
 *
 * 行为：
 *  - 加载目标 URL（默认线上地址，WEBTERM_URL / ~/.webterm/config.json 可覆盖）
 *  - 单实例锁：二次启动时聚焦已有窗口
 *  - 窗口尺寸/位置记忆到 ~/.webterm/window.json
 *  - 主框架加载失败时展示本地重试页（retry.html）
 *  - 外部链接 / 跨源导航交给系统默认浏览器
 *  - 安全：contextIsolation 开启，不向页面暴露任何 Node 能力
 */

const { app, BrowserWindow, Menu, shell } = require('electron');
const fs = require('fs');
const path = require('path');
const os = require('os');

const DEFAULT_URL = 'https://webterm.example.com/';
const DATA_DIR = path.join(os.homedir(), '.webterm');
const CONFIG_FILE = path.join(DATA_DIR, 'config.json');
const WINDOW_STATE_FILE = path.join(DATA_DIR, 'window.json');

// ---- TLS 逃生开关（默认严格校验）----
if (process.env.WEBTERM_INSECURE_TLS === '1') {
  // 必须在 app ready 之前设置
  app.commandLine.appendSwitch('ignore-certificate-errors');
}

// ---- 配置加载 ----
function loadConfig() {
  // 优先级：env > 配置文件 > 内置默认
  const fromEnv = process.env.WEBTERM_URL;
  if (fromEnv) {
    return normalizeUrl(fromEnv, 'WEBTERM_URL');
  }
  try {
    const raw = fs.readFileSync(CONFIG_FILE, 'utf8');
    const cfg = JSON.parse(raw);
    if (cfg && typeof cfg.url === 'string' && cfg.url) {
      return normalizeUrl(cfg.url, CONFIG_FILE);
    }
  } catch {
    // 配置文件不存在或解析失败都走默认
  }
  return normalizeUrl(DEFAULT_URL, 'default');
}

function normalizeUrl(url, source) {
  try {
    const u = new URL(url);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') {
      throw new Error(`unsupported protocol: ${u.protocol}`);
    }
    return { url: u.toString(), source };
  } catch (err) {
    console.warn(`[webterm] 无效的目标地址（来源 ${source}）：${url}，回退默认地址`);
    return { url: DEFAULT_URL, source: 'default' };
  }
}

// ---- 窗口状态记忆 ----
function loadWindowState() {
  const fallback = { width: 1280, height: 800 };
  try {
    const raw = fs.readFileSync(WINDOW_STATE_FILE, 'utf8');
    const state = JSON.parse(raw);
    return {
      width: Number(state.width) > 0 ? Number(state.width) : fallback.width,
      height: Number(state.height) > 0 ? Number(state.height) : fallback.height,
      x: Number.isFinite(state.x) ? state.x : undefined,
      y: Number.isFinite(state.y) ? state.y : undefined,
    };
  } catch {
    return fallback;
  }
}

function saveWindowState(win) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    const bounds = win.getNormalBounds(); // 非最大化时的位置尺寸
    fs.writeFileSync(WINDOW_STATE_FILE, JSON.stringify(bounds, null, 2), 'utf8');
  } catch {
    // 写失败不影响退出
  }
}

// ---- 主流程 ----
const gotSingleInstanceLock = app.requestSingleInstanceLock();
if (!gotSingleInstanceLock) {
  // 已有实例：直接退出，由已有实例聚焦窗口
  app.quit();
} else {
  let mainWindow = null;
  let target = loadConfig();

  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      if (!mainWindow.isVisible()) mainWindow.show();
      mainWindow.focus();
    }
  });

  function createWindow() {
    const state = loadWindowState();

    mainWindow = new BrowserWindow({
      width: state.width,
      height: state.height,
      x: state.x,
      y: state.y,
      minWidth: 640,
      minHeight: 480,
      title: 'webterm',
      autoHideMenuBar: true,
      backgroundColor: '#1e1e1e',
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
        spellcheck: false,
      },
    });

    Menu.setApplicationMenu(null);

    // 主框架加载失败 → 本地重试页（可点 Retry 重新加载目标地址）
    mainWindow.webContents.on('did-fail-load', (event, code, desc, url, isMainFrame) => {
      if (!isMainFrame) return;
      if (code === -3) return; // ERR_ABORTED：通常由重定向/手动取消引起，忽略
      mainWindow
        .loadFile(path.join(__dirname, 'retry.html'), {
          query: { url: target.url, code: String(code), desc: desc || '' },
        })
        .catch(() => {});
    });

    // 页面内的跨源导航 → 系统浏览器；同源导航放行
    const appOrigin = safeOrigin(target.url);
    mainWindow.webContents.on('will-navigate', (event, url) => {
      if (safeOrigin(url) !== appOrigin) {
        event.preventDefault();
        shell.openExternal(url);
      }
    });

    // window.open / target=_blank → 系统浏览器，不在壳内开新窗口
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
      shell.openExternal(url);
      return { action: 'deny' };
    });

    // 关闭时保存窗口状态
    mainWindow.on('close', () => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        saveWindowState(mainWindow);
      }
    });

    mainWindow.on('closed', () => {
      mainWindow = null;
    });

    mainWindow.loadURL(target.url).catch(() => {
      // did-fail-load 会处理，这里吞掉 promise 拒绝
    });
  }

  function safeOrigin(url) {
    try {
      return new URL(url).origin;
    } catch {
      return '';
    }
  }

  app.whenReady().then(() => {
    createWindow();
    console.log(`[webterm] 目标地址：${target.url}（来源：${target.source}）`);
  });

  app.on('window-all-closed', () => {
    app.quit();
  });

  app.on('activate', () => {
    // macOS：dock 点击时若无窗口则重建
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
}
