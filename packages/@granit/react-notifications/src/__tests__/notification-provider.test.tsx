import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  NotificationProvider,
  useNotificationContext,
} from '../providers/notification-provider.js';

import { createMockClient } from './test-utils.js';

import type {
  NotificationConfig,
  NotificationTransportMessage,
  NotificationTransport,
} from '@granit/notifications';
import type { AxiosInstance } from 'axios';

function createMockTransport(
  overrides: Partial<NotificationTransport> = {}
): NotificationTransport {
  return {
    state: 'disconnected',
    connect: vi.fn().mockResolvedValue(undefined),
    disconnect: vi.fn().mockResolvedValue(undefined),
    onNotification: vi.fn().mockReturnValue(() => {}),
    onStateChange: vi.fn().mockReturnValue(() => {}),
    ...overrides,
  };
}

function createProviderWrapper(
  client: AxiosInstance,
  transport?: NotificationTransport,
  configOverrides: Partial<NotificationConfig> = {}
) {
  return function Wrapper({ children }: Readonly<{ children: React.ReactNode }>) {
    const config: NotificationConfig = {
      apiClient: client,
      basePath: '/api/v1',
      ...configOverrides,
    };
    return (
      <NotificationProvider config={config} transport={transport}>
        {children}
      </NotificationProvider>
    );
  };
}

describe('NotificationProvider', () => {
  let client: AxiosInstance;

  beforeEach(() => {
    client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: { count: 0 } });
  });

  it('should provide context with initial values', () => {
    const { result } = renderHook(() => useNotificationContext(), {
      wrapper: createProviderWrapper(client),
    });

    expect(result.current.config.apiClient).toBe(client);
    expect(result.current.connectionState).toBe('disconnected');
    expect(result.current.lastMessage).toBeNull();
    expect(result.current.unreadCount).toBe(0);
  });

  it('should throw when used outside provider', () => {
    expect(() => {
      renderHook(() => useNotificationContext());
    }).toThrow('useNotificationContext must be used within a <NotificationProvider>');
  });

  it('should stay disconnected when no transport is provided', () => {
    const { result } = renderHook(() => useNotificationContext(), {
      wrapper: createProviderWrapper(client),
    });

    expect(result.current.connectionState).toBe('disconnected');
  });

  it('should connect transport and transition to connected state', async () => {
    const transport = createMockTransport();

    const { result } = renderHook(() => useNotificationContext(), {
      wrapper: createProviderWrapper(client, transport),
    });

    await waitFor(() => expect(result.current.connectionState).toBe('connected'));
    expect(transport.connect).toHaveBeenCalled();
    expect(transport.onNotification).toHaveBeenCalled();
    expect(transport.onStateChange).toHaveBeenCalled();
  });

  it('should handle transport connection failure', async () => {
    const transport = createMockTransport({
      connect: vi.fn().mockRejectedValue(new Error('Connection failed')),
    });

    const { result } = renderHook(() => useNotificationContext(), {
      wrapper: createProviderWrapper(client, transport),
    });

    await waitFor(() => expect(result.current.connectionState).toBe('disconnected'));
  });

  it('should handle incoming notifications from transport', async () => {
    let messageCallback: ((m: NotificationTransportMessage) => void) | null = null;

    const transport = createMockTransport({
      onNotification: vi.fn((cb) => {
        messageCallback = cb;
        return () => {};
      }),
    });

    const { result } = renderHook(() => useNotificationContext(), {
      wrapper: createProviderWrapper(client, transport),
    });

    await waitFor(() => expect(result.current.connectionState).toBe('connected'));

    const mockMsg: NotificationTransportMessage = {
      notificationId: 'n-99',
      notificationTypeName: 'SystemAlert',
      severity: 'Info',
      data: { title: 'Real-time notification' },
      relatedEntityType: null,
      relatedEntityId: null,
      occurredAt: '2026-01-15T10:00:00Z',
    };

    act(() => {
      messageCallback!(mockMsg);
    });

    expect(result.current.lastMessage).toEqual(mockMsg);
    expect(result.current.unreadCount).toBe(1);
  });

  it('should handle state changes from transport', async () => {
    let stateCallback: ((s: string) => void) | null = null;

    const transport = createMockTransport({
      onStateChange: vi.fn((cb) => {
        stateCallback = cb;
        return () => {};
      }),
    });

    const { result } = renderHook(() => useNotificationContext(), {
      wrapper: createProviderWrapper(client, transport),
    });

    await waitFor(() => expect(result.current.connectionState).toBe('connected'));

    act(() => {
      stateCallback!('reconnecting');
    });
    expect(result.current.connectionState).toBe('reconnecting');

    act(() => {
      stateCallback!('connected');
    });
    expect(result.current.connectionState).toBe('connected');

    act(() => {
      stateCallback!('disconnected');
    });
    expect(result.current.connectionState).toBe('disconnected');
  });

  it('should disconnect transport on unmount', async () => {
    const unsubNotification = vi.fn();
    const unsubState = vi.fn();

    const transport = createMockTransport({
      onNotification: vi.fn().mockReturnValue(unsubNotification),
      onStateChange: vi.fn().mockReturnValue(unsubState),
    });

    const { unmount } = renderHook(() => useNotificationContext(), {
      wrapper: createProviderWrapper(client, transport),
    });

    await waitFor(() => expect(transport.connect).toHaveBeenCalled());

    unmount();

    expect(transport.disconnect).toHaveBeenCalled();
    expect(unsubNotification).toHaveBeenCalled();
    expect(unsubState).toHaveBeenCalled();
  });
});
