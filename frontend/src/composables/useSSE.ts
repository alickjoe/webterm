import { ref, onUnmounted } from 'vue';

export function useSSE(url: string) {
  const connected = ref(false);
  const error = ref<string | null>(null);
  let eventSource: EventSource | null = null;
  let retryCount = 0;
  const maxRetries = 5;
  const handlers = new Map<string, (data: any) => void>();

  function connect() {
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

    // Register all existing handlers
    for (const [event, handler] of handlers) {
      eventSource.addEventListener(event, ((e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          handler(data);
        } catch {
          handler(e.data);
        }
      }) as EventListener);
    }
  }

  function on(event: string, handler: (data: any) => void) {
    handlers.set(event, handler);
    if (eventSource) {
      eventSource.addEventListener(event, ((e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          handler(data);
        } catch {
          handler(e.data);
        }
      }) as EventListener);
    }
  }

  function close() {
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }
    connected.value = false;
  }

  onUnmounted(close);

  return { connected, error, connect, on, close };
}
