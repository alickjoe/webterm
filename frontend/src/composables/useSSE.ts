import { ref } from 'vue';

export function useSSE(url: string) {
  const connected = ref(false);
  const error = ref<string | null>(null);
  let eventSource: EventSource | null = null;
  let retryCount = 0;
  const maxRetries = 5;
  const handlers = new Map<string, (data: any) => void>();

  function connect() {
    // Close existing connection if any
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }

    const token = localStorage.getItem('token');
    const separator = url.includes('?') ? '&' : '?';
    const fullUrl = `${url}${separator}token=${token}`;

    eventSource = new EventSource(fullUrl);

    eventSource.onopen = () => {
      connected.value = true;
      error.value = null;
      retryCount = 0;
    };

    eventSource.onerror = () => {
      connected.value = false;

      // EventSource auto-reconnects when readyState is CONNECTING
      // Only handle CLOSED state (permanent failure)
      if (eventSource?.readyState === EventSource.CLOSED) {
        if (retryCount < maxRetries) {
          retryCount++;
          const delay = Math.min(1000 * Math.pow(2, retryCount), 30000);
          setTimeout(connect, delay);
        } else {
          error.value = 'Connection lost. Max retries reached.';
        }
      }
    };

    // Register all existing handlers on the new EventSource
    for (const [event, handler] of handlers) {
      addEventHandler(eventSource, event, handler);
    }
  }

  function addEventHandler(es: EventSource, event: string, handler: (data: any) => void) {
    es.addEventListener(event, ((e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        handler(data);
      } catch {
        handler(e.data);
      }
    }) as EventListener);
  }

  function on(event: string, handler: (data: any) => void) {
    handlers.set(event, handler);
    if (eventSource) {
      addEventHandler(eventSource, event, handler);
    }
  }

  function close() {
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }
    connected.value = false;
  }

  // NOTE: Caller is responsible for calling close() on cleanup.
  // Do NOT call onUnmounted here - this composable may be invoked
  // outside of Vue's setup context (e.g. inside an async function).

  return { connected, error, connect, on, close };
}
