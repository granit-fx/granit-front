import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { UserNotification } from '@granit/notifications';

let capturedUrl: string | null = null;
let capturedOptions: Record<string, unknown> | null = null;

vi.mock('@microsoft/fetch-event-source', () => ({
  fetchEventSource: async (url: string, options: Record<string, unknown>) => {
    capturedUrl = url;
    capturedOptions = options;
    const onopen = options.onopen as (response: Response) => Promise<void>;
    if (onopen) {
      await onopen(
        new Response(null, {
          status: 200,
          headers: { 'content-type': 'text/event-stream' },
        })
      );
    }
  },
  EventStreamContentType: 'text/event-stream',
}));

// Dynamic import AFTER mock is defined
const { createSseTransport } = await import('../transports/create-sse-transport.js');

describe('createSseTransport', () => {
  beforeEach(() => {
    capturedUrl = null;
    capturedOptions = null;
    vi.clearAllMocks();
  });

  it('should create a transport with initial disconnected state', () => {
    const transport = createSseTransport({ streamUrl: '/api/v1/notifications/stream' });
    expect(transport.state).toBe('disconnected');
  });

  it('should connect and transition to connected state', async () => {
    const transport = createSseTransport({ streamUrl: '/api/v1/notifications/stream' });
    const stateListener = vi.fn();
    transport.onStateChange(stateListener);

    await transport.connect();

    expect(capturedUrl).toBe('/api/v1/notifications/stream');
    expect(capturedOptions).toMatchObject({ openWhenHidden: true });
    expect(stateListener).toHaveBeenCalledWith('connected');
  });

  it('should dispatch notifications from SSE messages', async () => {
    const transport = createSseTransport({ streamUrl: '/api/v1/notifications/stream' });
    const listener = vi.fn();
    transport.onNotification(listener);

    await transport.connect();

    const onmessage = capturedOptions!.onmessage as (event: {
      event: string;
      data: string;
    }) => void;
    const mockNotif: UserNotification = {
      id: 'n-1',
      title: 'SSE Notification',
      body: null,
      severity: 'info',
      entityType: null,
      entityId: null,
      isRead: false,
      createdAt: '2026-01-15T10:00:00Z',
      readAt: null,
    };

    onmessage({ event: 'notification', data: JSON.stringify(mockNotif) });
    expect(listener).toHaveBeenCalledWith(mockNotif);
  });

  it('should filter heartbeat messages', async () => {
    const transport = createSseTransport({ streamUrl: '/api/v1/notifications/stream' });
    const listener = vi.fn();
    transport.onNotification(listener);

    await transport.connect();

    const onmessage = capturedOptions!.onmessage as (event: {
      event: string;
      data: string;
    }) => void;
    onmessage({ event: '__heartbeat__', data: '{}' });
    expect(listener).not.toHaveBeenCalled();
  });

  it('should filter custom heartbeat type names', async () => {
    const transport = createSseTransport({
      streamUrl: '/api/v1/notifications/stream',
      heartbeatTypeName: 'ping',
    });
    const listener = vi.fn();
    transport.onNotification(listener);

    await transport.connect();

    const onmessage = capturedOptions!.onmessage as (event: {
      event: string;
      data: string;
    }) => void;
    onmessage({ event: 'ping', data: '{}' });
    expect(listener).not.toHaveBeenCalled();
  });

  it('should skip malformed JSON events silently', async () => {
    const transport = createSseTransport({ streamUrl: '/api/v1/notifications/stream' });
    const listener = vi.fn();
    transport.onNotification(listener);

    await transport.connect();

    const onmessage = capturedOptions!.onmessage as (event: {
      event: string;
      data: string;
    }) => void;
    onmessage({ event: 'notification', data: 'not-json{' });
    expect(listener).not.toHaveBeenCalled();
  });

  it('should skip events with empty data', async () => {
    const transport = createSseTransport({ streamUrl: '/api/v1/notifications/stream' });
    const listener = vi.fn();
    transport.onNotification(listener);

    await transport.connect();

    const onmessage = capturedOptions!.onmessage as (event: {
      event: string;
      data: string;
    }) => void;
    onmessage({ event: 'notification', data: '' });
    expect(listener).not.toHaveBeenCalled();
  });

  it('should set reconnecting state on retriable error', async () => {
    const transport = createSseTransport({ streamUrl: '/api/v1/notifications/stream' });
    const stateListener = vi.fn();
    transport.onStateChange(stateListener);

    await transport.connect();

    const onerror = capturedOptions!.onerror as (err: Error) => void;
    onerror(new Error('Temporary failure'));
    expect(stateListener).toHaveBeenCalledWith('reconnecting');
  });

  it('should set disconnected state on close', async () => {
    const transport = createSseTransport({ streamUrl: '/api/v1/notifications/stream' });
    const stateListener = vi.fn();
    transport.onStateChange(stateListener);

    await transport.connect();

    const onclose = capturedOptions!.onclose as () => void;
    onclose();
    expect(stateListener).toHaveBeenCalledWith('disconnected');
  });

  it('should disconnect by aborting the connection', async () => {
    const transport = createSseTransport({ streamUrl: '/api/v1/notifications/stream' });

    await transport.connect();

    const signal = capturedOptions!.signal as AbortSignal;
    expect(signal.aborted).toBe(false);

    await transport.disconnect();

    expect(signal.aborted).toBe(true);
    expect(transport.state).toBe('disconnected');
  });

  it('should handle disconnect when not connected', async () => {
    const transport = createSseTransport({ streamUrl: '/api/v1/notifications/stream' });
    await transport.disconnect();
    expect(transport.state).toBe('disconnected');
  });

  it('should inject auth headers via custom fetch when tokenGetter is provided', async () => {
    const tokenGetter = vi.fn().mockResolvedValue('my-token');
    const transport = createSseTransport({
      streamUrl: '/api/v1/notifications/stream',
      tokenGetter,
    });

    await transport.connect();

    expect(capturedOptions!.fetch).toBeDefined();
    const customFetch = capturedOptions!.fetch as (
      input: RequestInfo,
      init?: RequestInit
    ) => Promise<Response>;

    const mockResponse = new Response(null, { status: 200 });
    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn().mockResolvedValue(mockResponse);

    try {
      await customFetch('/api/v1/notifications/stream', {});
      const calledInit = vi.mocked(globalThis.fetch).mock.calls[0]![1]!;
      const headers = new Headers(calledInit.headers);
      expect(headers.get('Authorization')).toBe('Bearer my-token');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('should not set Authorization header when tokenGetter returns null', async () => {
    const tokenGetter = vi.fn().mockResolvedValue(null);
    const transport = createSseTransport({
      streamUrl: '/api/v1/notifications/stream',
      tokenGetter,
    });

    await transport.connect();

    const customFetch = capturedOptions!.fetch as (
      input: RequestInfo,
      init?: RequestInit
    ) => Promise<Response>;

    const mockResponse = new Response(null, { status: 200 });
    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn().mockResolvedValue(mockResponse);

    try {
      await customFetch('/api/v1/notifications/stream', {});
      const calledInit = vi.mocked(globalThis.fetch).mock.calls[0]![1]!;
      const headers = new Headers(calledInit.headers);
      expect(headers.get('Authorization')).toBeNull();
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('should not set custom fetch when no tokenGetter', async () => {
    const transport = createSseTransport({ streamUrl: '/api/v1/notifications/stream' });
    await transport.connect();

    expect(capturedOptions!.fetch).toBeUndefined();
  });

  it('should unsubscribe notification listeners', async () => {
    const transport = createSseTransport({ streamUrl: '/api/v1/notifications/stream' });
    const listener = vi.fn();
    const unsub = transport.onNotification(listener);

    await transport.connect();
    unsub();

    const onmessage = capturedOptions!.onmessage as (event: {
      event: string;
      data: string;
    }) => void;
    onmessage({
      event: 'notification',
      data: JSON.stringify({ id: 'n-1', title: 'Test' }),
    });
    expect(listener).not.toHaveBeenCalled();
  });
});
