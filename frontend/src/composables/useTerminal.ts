import { ref, onUnmounted, type Ref } from 'vue';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { useSSE } from './useSSE';
import { sendInput, resizeTerminal, closeTerminalSession, createTerminalSession } from '@/api/terminal.api';

export function useTerminal(containerRef: Ref<HTMLElement | null>) {
  const sessionId = ref<string | null>(null);
  const connected = ref(false);
  const error = ref<string | null>(null);
  let terminal: Terminal | null = null;
  let fitAddon: FitAddon | null = null;
  let sse: ReturnType<typeof useSSE> | null = null;
  let inputBuffer = '';
  let inputTimer: ReturnType<typeof setTimeout> | null = null;

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
    const data = btoa(inputBuffer);
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
          const decoded = atob(data.output);
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

  function dispose() {
    disconnect();
    if (terminal) {
      terminal.dispose();
      terminal = null;
    }
    fitAddon = null;
  }

  onUnmounted(dispose);

  return { sessionId, connected, error, initTerminal, connect, disconnect, dispose };
}
