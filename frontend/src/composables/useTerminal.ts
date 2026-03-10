import { ref, onUnmounted, type Ref } from 'vue';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { useSSE } from './useSSE';
import { sendInput, resizeTerminal, closeTerminalSession, createTerminalSession } from '@/api/terminal.api';

export interface UseTerminalOptions {
  onCommand?: (command: string) => void;
}

export function useTerminal(containerRef: Ref<HTMLElement | null>, options?: UseTerminalOptions) {
  const sessionId = ref<string | null>(null);
  const connected = ref(false);
  const error = ref<string | null>(null);
  let terminal: Terminal | null = null;
  let fitAddon: FitAddon | null = null;
  let sse: ReturnType<typeof useSSE> | null = null;
  let inputBuffer = '';
  let inputTimer: ReturnType<typeof setTimeout> | null = null;

  // Command line tracking for history
  let commandLineBuffer = '';
  let inEscapeSeq = false;

  function initTerminal() {
    if (!containerRef.value) return;

    terminal = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Menlo, Monaco, monospace",
      theme: {
        background: '#1a1b26',
        foreground: '#a9b1d6',
        cursor: '#c0caf5',
        selectionBackground: '#33467c',
        black: '#15161e',
        red: '#f7768e',
        green: '#9ece6a',
        yellow: '#e0af68',
        blue: '#7aa2f7',
        magenta: '#bb9af7',
        cyan: '#7dcfff',
        white: '#a9b1d6',
        brightBlack: '#414868',
        brightRed: '#f7768e',
        brightGreen: '#9ece6a',
        brightYellow: '#e0af68',
        brightBlue: '#7aa2f7',
        brightMagenta: '#bb9af7',
        brightCyan: '#7dcfff',
        brightWhite: '#c0caf5',
      },
    });

    fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);
    terminal.loadAddon(new WebLinksAddon());

    terminal.open(containerRef.value);
    fitAddon.fit();

    // Handle user input - batch and send
    terminal.onData((data) => {
      if (!sessionId.value) return;

      // Track command line for history
      for (const ch of data) {
        if (inEscapeSeq) {
          // End of escape sequence on a letter or ~
          if ((ch >= 'A' && ch <= 'Z') || (ch >= 'a' && ch <= 'z') || ch === '~') {
            inEscapeSeq = false;
          }
          continue;
        }
        if (ch === '\x1b') {
          inEscapeSeq = true;
          continue;
        }
        if (ch === '\r') {
          const cmd = commandLineBuffer.trim();
          if (cmd) {
            options?.onCommand?.(cmd);
          }
          commandLineBuffer = '';
        } else if (ch === '\x7f' || ch === '\b') {
          commandLineBuffer = commandLineBuffer.slice(0, -1);
        } else if (ch === '\x03') {
          commandLineBuffer = '';
        } else if (ch === '\t') {
          // Ignore tab (completion handled server-side)
        } else if (ch >= ' ') {
          commandLineBuffer += ch;
        }
      }

      inputBuffer += data;
      if (inputTimer) clearTimeout(inputTimer);
      inputTimer = setTimeout(flushInput, 30);
    });

    // Handle resize
    const resizeObserver = new ResizeObserver(() => {
      if (fitAddon && terminal) {
        fitAddon.fit();
        if (sessionId.value) {
          resizeTerminal(sessionId.value, terminal.cols, terminal.rows).catch(() => {});
        }
      }
    });

    resizeObserver.observe(containerRef.value);

    return () => {
      resizeObserver.disconnect();
    };
  }

  async function flushInput() {
    if (!sessionId.value || !inputBuffer) return;
    // Use utf8ToBase64 to support Unicode characters (Chinese, emoji, etc.)
    const data = utf8ToBase64(inputBuffer);
    inputBuffer = '';
    try {
      await sendInput(sessionId.value, data);
    } catch (err) {
      error.value = 'Failed to send input';
    }
  }

  async function connect(connectionId: string) {
    try {
      error.value = null;

      if (!terminal) {
        initTerminal();
      }

      terminal?.writeln('\x1b[33mConnecting...\x1b[0m');

      const { sessionId: sid } = await createTerminalSession(connectionId);
      sessionId.value = sid;

      // Setup SSE stream
      sse = useSSE(`/api/terminal/sessions/${sid}/stream`);

      sse.on('output', (data: { output: string }) => {
        if (terminal) {
          // Use base64ToUtf8 to support Unicode characters (Chinese, emoji, etc.)
          const decoded = base64ToUtf8(data.output);
          terminal.write(decoded);
        }
      });

      sse.on('connected', () => {
        connected.value = true;
        // Send initial resize
        if (terminal && sessionId.value) {
          resizeTerminal(sessionId.value, terminal.cols, terminal.rows).catch(() => {});
        }
      });

      sse.on('error', (data: { code: string; message: string }) => {
        error.value = `SSH Error: ${data.message}`;
        terminal?.writeln(`\r\n\x1b[31mError: ${data.message}\x1b[0m`);
      });

      sse.on('close', (data: { reason: string }) => {
        connected.value = false;
        terminal?.writeln(`\r\n\x1b[33mSession closed: ${data.reason}\x1b[0m`);
      });

      sse.connect();
    } catch (err: any) {
      error.value = err.response?.data?.error || err.message || 'Connection failed';
      terminal?.writeln(`\r\n\x1b[31m${error.value}\x1b[0m`);
    }
  }

  async function disconnect() {
    if (sse) {
      sse.close();
      sse = null;
    }
    if (sessionId.value) {
      try {
        await closeTerminalSession(sessionId.value);
      } catch {}
      sessionId.value = null;
    }
    connected.value = false;
  }

  function fit() {
    if (fitAddon && terminal) {
      fitAddon.fit();
      if (sessionId.value) {
        resizeTerminal(sessionId.value, terminal.cols, terminal.rows).catch(() => {});
      }
    }
  }

  function writeText(text: string) {
    if (!sessionId.value || !text) return;
    // Use utf8ToBase64 to support Unicode characters
    sendInput(sessionId.value, utf8ToBase64(text)).catch(() => {});
  }

  // Helper: Encode UTF-8 string to Base64 (supports Unicode)
  function utf8ToBase64(str: string): string {
    const bytes = new TextEncoder().encode(str);
    const bin = Array.from(bytes, (b) => String.fromCharCode(b)).join('');
    return btoa(bin);
  }

  // Helper: Decode Base64 to UTF-8 string (supports Unicode)
  function base64ToUtf8(base64: string): string {
    const bin = atob(base64);
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  }

  function dispose() {
    disconnect();
    if (terminal) {
      terminal.dispose();
      terminal = null;
    }
    fitAddon = null;
  }

  onUnmounted(dispose);

  return { sessionId, connected, error, initTerminal, connect, disconnect, dispose, fit, writeText };
}
