import { toEntityId, toISODateString } from '@granit/types';
import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useNotifications } from '../hooks/use-notifications.js';

import {
  axiosResponse,
  createMockClient,
  createWrapper,
  createWrapperWithoutBasePath,
} from './test-utils.js';

import type { UserNotification, UserNotificationPage } from '@granit/notifications';

const MOCK_NOTIFICATION: UserNotification = {
  id: toEntityId<'UserNotification'>('n-1'),
  notificationId: toEntityId<'Notification'>('notif-1'),
  notificationTypeName: 'NewMessage',
  severity: 'Info',
  data: { title: 'Nouveau message', body: 'Contenu du message' },
  recipientUserId: toEntityId<'User'>('u-1'),
  relatedEntityType: null,
  relatedEntityId: null,
  state: 'Unread',
  createdAt: toISODateString('2026-01-15T10:00:00Z'),
  readAt: null,
};

const MOCK_PAGE: UserNotificationPage = {
  items: [MOCK_NOTIFICATION],
  totalCount: 1,
  nextCursor: null,
  unreadCount: 1,
};

describe('useNotifications', () => {
  it('should fetch notifications on mount', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse(MOCK_PAGE));

    const { result } = renderHook(() => useNotifications(), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.notifications).toHaveLength(1);
    expect(result.current.notifications[0]!.notificationTypeName).toBe('NewMessage');
    expect(result.current.totalCount).toBe(1);
  });

  it('should mark a notification as read', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse(MOCK_PAGE));
    vi.mocked(client.post).mockResolvedValue(axiosResponse(undefined));

    const { result } = renderHook(() => useNotifications(), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.markRead(toEntityId<'UserNotification'>('n-1'));
    });

    expect(result.current.notifications[0]!.state).toBe('Read');
  });

  it('should mark all as read', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse(MOCK_PAGE));
    vi.mocked(client.post).mockResolvedValue(axiosResponse(undefined));

    const { result } = renderHook(() => useNotifications(), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.markAllRead();
    });

    expect(result.current.notifications.every((n) => n.state === 'Read')).toBe(true);
  });

  it('should report hasMore when totalCount > loaded items', async () => {
    const page: UserNotificationPage = {
      items: [MOCK_NOTIFICATION],
      totalCount: 50,
      nextCursor: null,
      unreadCount: 10,
    };
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse(page));

    const { result } = renderHook(() => useNotifications({ pageSize: 20 }), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.hasMore).toBe(true);
  });

  it('should handle fetch errors', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useNotifications(), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe('Network error');
  });

  it('should load more notifications when loadMore is called', async () => {
    const page1: UserNotificationPage = {
      items: [MOCK_NOTIFICATION],
      totalCount: 2,
      nextCursor: null,
      unreadCount: 2,
    };
    const n2: UserNotification = {
      ...MOCK_NOTIFICATION,
      id: toEntityId<'UserNotification'>('n-2'),
      notificationId: toEntityId<'Notification'>('notif-2'),
      data: { title: 'Deuxième notification' },
    };
    const page2: UserNotificationPage = {
      items: [n2],
      totalCount: 2,
      nextCursor: null,
      unreadCount: 2,
    };

    const client = createMockClient();
    vi.mocked(client.get)
      .mockResolvedValueOnce(axiosResponse(page1))
      .mockResolvedValueOnce(axiosResponse(page2));

    const { result } = renderHook(() => useNotifications({ pageSize: 1 }), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.notifications).toHaveLength(1);
    expect(result.current.hasMore).toBe(true);

    await act(async () => {
      result.current.loadMore();
    });

    await waitFor(() => expect(result.current.loadingMore).toBe(false));
    expect(result.current.notifications).toHaveLength(2);
  });

  it('should use custom pageSize option', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse(MOCK_PAGE));

    const { result } = renderHook(() => useNotifications({ pageSize: 5 }), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.notifications).toHaveLength(1);
    expect(client.get).toHaveBeenCalledWith(
      expect.stringContaining('notifications'),
      expect.objectContaining({ params: expect.objectContaining({ pageSize: 5 }) })
    );
  });

  it('should refresh the notification list', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse(MOCK_PAGE));

    const { result } = renderHook(() => useNotifications(), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    const updatedPage: UserNotificationPage = {
      items: [{ ...MOCK_NOTIFICATION, data: { title: 'Mis à jour' } }],
      totalCount: 1,
      nextCursor: null,
      unreadCount: 0,
    };
    vi.mocked(client.get).mockResolvedValue(axiosResponse(updatedPage));

    await act(async () => {
      result.current.refresh();
    });

    await waitFor(() => expect(result.current.loading).toBe(false));
  });

  it('should use default basePath when config.basePath is undefined', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse(MOCK_PAGE));

    const { result } = renderHook(() => useNotifications(), {
      wrapper: createWrapperWithoutBasePath(client),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(client.get).toHaveBeenCalledWith(expect.stringContaining('/api'), expect.anything());
  });

  it('should not modify other notifications when marking one as read', async () => {
    const n2: UserNotification = {
      ...MOCK_NOTIFICATION,
      id: toEntityId<'UserNotification'>('n-2'),
      notificationId: toEntityId<'Notification'>('notif-2'),
      data: { title: 'Autre notification' },
    };
    const page: UserNotificationPage = {
      items: [MOCK_NOTIFICATION, n2],
      totalCount: 2,
      nextCursor: null,
      unreadCount: 2,
    };
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse(page));
    vi.mocked(client.post).mockResolvedValue(axiosResponse(undefined));

    const { result } = renderHook(() => useNotifications(), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.markRead(toEntityId<'UserNotification'>('n-1'));
    });

    expect(result.current.notifications[0]!.state).toBe('Read');
    expect(result.current.notifications[1]!.state).toBe('Unread');
    expect(result.current.notifications[1]!.id).toBe(toEntityId<'UserNotification'>('n-2'));
  });

  it('should use default pageSize when no options are provided', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse(MOCK_PAGE));

    const { result } = renderHook(() => useNotifications(), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(client.get).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ params: expect.objectContaining({ pageSize: 20 }) })
    );
  });
});
