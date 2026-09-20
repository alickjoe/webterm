#!/usr/bin/env node
'use strict';

/**
 * CDP 字体探测：通过 remote-debugging-port 询问页面渲染进程
 * document.fonts.check 是否认为 CJK / emoji 字体可用。
 * 用法: node cdp-font-probe.js <ws-url>
 */

const wsUrl = process.argv[2];
if (!wsUrl) {
  console.error('usage: node cdp-font-probe.js <ws-url>');
  process.exit(1);
}

const ws = new WebSocket(wsUrl);
let id = 0;
const pending = new Map();

function send(method, params) {
  return new Promise((resolve) => {
    const msgId = ++id;
    pending.set(msgId, resolve);
    ws.send(JSON.stringify({ id: msgId, method, params }));
  });
}

ws.onopen = async () => {
  const probes = [
    ['zh-general', 'sans-serif', '中文测试'],
    ['zh-explicit', '"Noto Sans CJK SC"', '中'],
    ['emoji-dir', '"Noto Color Emoji"', '📁'],
    ['emoji-file', '"Noto Color Emoji"', '📄'],
    ['latin', 'sans-serif', 'abc'],
  ];
  for (const [name, font, text] of probes) {
    const expr = `document.fonts.check('16px ${font}', ${JSON.stringify(text)})`;
    const res = await send('Runtime.evaluate', { expression: expr, returnByValue: true });
    console.log(`${name.padEnd(12)} ${font.padEnd(22)} "${text}" -> ${res.result?.result?.value ?? JSON.stringify(res.result)}`);
  }
  ws.close();
  process.exit(0);
};

ws.onerror = (e) => {
  console.error('ws error', e.message || e);
  process.exit(1);
};

ws.onmessage = (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) {
    pending.get(msg.id)(msg.result);
    pending.delete(msg.id);
  }
};

setTimeout(() => { console.error('timeout'); process.exit(1); }, 10000);
