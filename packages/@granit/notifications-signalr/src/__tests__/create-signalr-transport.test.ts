import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createSignalRTransport } from '../transports/create-signalr-transport.js';

import type { NotificationTransportMessage } from '@granit/notifications';

let lastConnection: {
  start: ReturnType<typeof vi.fn>;
  stop: ReturnType<typeof vi.fn>;
  on: ReturnType<typeof vi.fn>;
  onreconnecting: ReturnType<typeof vi.fn>;
  onreconnected: ReturnType<typeof vi.fn>;
  onclose: ReturnType<typeof vi.fn>;
};

let capturedWithUrlArgs: { url: string; options: Record<string, unknown> } | null = null;

function resetLastConnection() {
  lastConnection = {
    start: vi.fn().mockResolvedValue(undefined),
    stop: vi.fn().mockResolvedValue(undefined),
    on: vi.fn(),
    onreconnecting: vi.fn(),
    onreconnected: vi.fn(),
    onclose: vi.fn(),
  };
}

vi.mock('@microsoft/signalr', () => {
  function HubConnectionBuilder() {
    return {
      withUrl: vi.fn(function (
        this: ReturnType<typeof HubConnectionBuilder>,
        url: string,
        options: Record<string, unknown>
      ) {
        capturedWithUrlArgs = { url, options };
        return this;
      }),
      withAutomaticReconnect: vi.fn().mockReturnThis(),
      configureLogging: vi.fn().mockReturnThis(),
      build: vi.fn(() => lastConnection),
    };
  }

  return {
    HubConnectionBuilder,
    HttpTransportType: { WebSockets: 1, LongPolling: 4 },
    LogLevel: { Warning: 3 },
  };
});

describe('createSignalRTransport', () => {
  beforeEach(() => {
    resetLastConnection();
    capturedWithUrlArgs = null;
  });

  it('should create a transport with initial disconnected state', () => {
    const transport = createSignalRTransport({ hubUrl: '/hubs/notifications' });
    expect(transport.state).toBe('disconnected');
  });

  it('should connect to the hub and register event handlers', async () => {
    const transport = createSignalRTransport({ hubUrl: '/hubs/notifications' });
    await transport.connect();

    expect(lastConnection.start).toHaveBeenCalled();
    expect(capturedWithUrlArgs!.url).toBe('/hubs/notifications');
    expect(lastConnection.on).toHaveBeenCalledWith('ReceiveNotification', expect.any(Function));
    expect(lastConnection.onreconnecting).toHaveBeenCalled();
    expect(lastConnection.onreconnected).toHaveBeenCalled();
    expect(lastConnection.onclose).toHaveBeenCalled();
  });

  it('should pass tokenGetter as accessTokenFactory', async () => {
    const tokenGetter = vi.fn().mockResolvedValue('test-token');
    const transport = createSignalRTransport({
      hubUrl: '/hubs/test',
      tokenGetter,
    });

    await transport.connect();

    expect(capturedWithUrlArgs!.options).toHaveProperty('accessTokenFactory');
    const factory = capturedWithUrlArgs!.options.accessTokenFactory as () => Promise<string>;
    const token = await factory();
    expect(token).toBe('test-token');
  });

  it('should return empty string when tokenGetter returns null', async () => {
    const tokenGetter = vi.fn().mockResolvedValue(null);
    const transport = createSignalRTransport({
      hubUrl: '/hubs/test',
      tokenGetter,
    });

    await transport.connect();

    const factory = capturedWithUrlArgs!.options.accessTokenFactory as () => Promise<string>;
    const token = await factory();
    expect(token).toBe('');
  });

  it('should not set accessTokenFactory when no tokenGetter', async () => {
    const transport = createSignalRTransport({ hubUrl: '/hubs/test' });
    await transport.connect();

    expect(capturedWithUrlArgs!.options.accessTokenFactory).toBeUndefined();
  });

  it('should dispatch incoming notifications to listeners', async () => {
    const transport = createSignalRTransport({ hubUrl: '/hubs/notifications' });
    const listener = vi.fn();
    transport.onNotification(listener);

    await transport.connect();

    const receiveCall = lastConnection.on.mock.calls.find(
      (call: unknown[]) => call[0] === 'ReceiveNotification'
    );
    const handler = receiveCall![1] as (m: NotificationTransportMessage) => void;

    const mockMsg: NotificationTransportMessage = {
      notificationId: 'n-1',
      notificationTypeName: 'SystemAlert',
      severity: 'Info',
      data: { title: 'Test' },
      relatedEntityType: null,
      relatedEntityId: null,
      occurredAt: '2026-01-15T10:00:00Z',
    };

    handler(mockMsg);
    expect(listener).toHaveBeenCalledWith(mockMsg);
  });

  it('should handle reconnecting, reconnected, and onclose events', async () => {
    const transport = createSignalRTransport({ hubUrl: '/hubs/notifications' });
    const stateListener = vi.fn();
    transport.onStateChange(stateListener);

    await transport.connect();

    const reconnectingHandler = lastConnection.onreconnecting.mock.calls[0]![0] as () => void;
    reconnectingHandler();
    expect(stateListener).toHaveBeenCalledWith('reconnecting');

    const reconnectedHandler = lastConnection.onreconnected.mock.calls[0]![0] as () => void;
    reconnectedHandler();
    expect(stateListener).toHaveBeenCalledWith('connected');

    const oncloseHandler = lastConnection.onclose.mock.calls[0]![0] as () => void;
    oncloseHandler();
    expect(stateListener).toHaveBeenCalledWith('disconnected');
  });

  it('should stop connection on disconnect', async () => {
    const transport = createSignalRTransport({ hubUrl: '/hubs/notifications' });
    await transport.connect();
    await transport.disconnect();

    expect(lastConnection.stop).toHaveBeenCalled();
    expect(transport.state).toBe('disconnected');
  });

  it('should handle disconnect when not connected', async () => {
    const transport = createSignalRTransport({ hubUrl: '/hubs/notifications' });
    await transport.disconnect();
    expect(transport.state).toBe('disconnected');
  });

  it('should unsubscribe notification listeners', async () => {
    const transport = createSignalRTransport({ hubUrl: '/hubs/notifications' });
    const listener = vi.fn();
    const unsub = transport.onNotification(listener);

    await transport.connect();
    unsub();

    const receiveCall = lastConnection.on.mock.calls.find(
      (call: unknown[]) => call[0] === 'ReceiveNotification'
    );
    const handler = receiveCall![1] as (m: NotificationTransportMessage) => void;

    handler({
      notificationId: 'n-1',
      notificationTypeName: 'SystemAlert',
      severity: 'Info',
      data: { title: 'Test' },
      relatedEntityType: null,
      relatedEntityId: null,
      occurredAt: '2026-01-15T10:00:00Z',
    });

    expect(listener).not.toHaveBeenCalled();
  });

  it('should unsubscribe state listeners', async () => {
    const transport = createSignalRTransport({ hubUrl: '/hubs/notifications' });
    const listener = vi.fn();
    const unsub = transport.onStateChange(listener);

    await transport.connect();
    listener.mockClear();
    unsub();

    const oncloseHandler = lastConnection.onclose.mock.calls[0]![0] as () => void;
    oncloseHandler();

    expect(listener).not.toHaveBeenCalled();
  });
});
