import { toEntityId, toISODateString } from '@granit/types';
import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useEntityActivityFeed } from '../hooks/use-entity-activity-feed';

import {
  axiosResponse,
  createMockClient,
  createWrapper,
  createWrapperWithoutBasePath,
} from './test-utils';

import type { UserNotification, UserNotificationPage } from '@granit/notifications';

const MOCK_ENTRY: UserNotification = {
  id: toEntityId<'UserNotification'>('n-1'),
  notificationId: toEntityId<'Notification'>('notif-1'),
  notificationTypeName: 'country_updated',
  severity: 'Info',
  data: { title: 'Consultation ajoutée', body: null, userDisplayName: 'Dr. Martin' },
  recipientUserId: toEntityId<'User'>('u-1'),
  relatedEntityType: 'Patient',
  relatedEntityId: 'p-1',
  state: 'Unread',
  createdAt: toISODateString('2026-01-15T10:00:00Z'),
  readAt: null,
};

const MOCK_FEED: UserNotificationPage = {
  items: [MOCK_ENTRY],
  totalCount: 1,
  hasMore: false,
  nextCursor: null,
};

describe('useEntityActivityFeed', () => {
  it('should fetch activity feed for an entity', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse(MOCK_FEED));

    const { result } = renderHook(
      () =>
        useEntityActivityFeed({
          entityType: 'Patient',
          entityId: 'p-1',
        }),
      { wrapper: createWrapper(client) }
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.entries).toHaveLength(1);
    const data = result.current.entries[0]!.data as { title?: string };
    expect(data.title).toBe('Consultation ajoutée');
  });

  it('should handle fetch errors', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockRejectedValue(new Error('Server error'));

    const { result } = renderHook(
      () =>
        useEntityActivityFeed({
          entityType: 'Patient',
          entityId: 'p-1',
        }),
      { wrapper: createWrapper(client) }
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe('Server error');
  });

  it('should report hasMore correctly', async () => {
    const page: UserNotificationPage = {
      items: [MOCK_ENTRY],
      totalCount: 25,
      hasMore: true,
      nextCursor: null,
    };
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse(page));

    const { result } = renderHook(
      () =>
        useEntityActivityFeed({
          entityType: 'Patient',
          entityId: 'p-1',
          pageSize: 10,
        }),
      { wrapper: createWrapper(client) }
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.hasMore).toBe(true);
  });

  it('should load more entries when loadMore is called', async () => {
    const entry2: UserNotification = {
      ...MOCK_ENTRY,
      id: toEntityId<'UserNotification'>('n-2'),
      notificationId: toEntityId<'Notification'>('notif-2'),
      data: { title: 'Deuxième entrée' },
    };
    const page1: UserNotificationPage = {
      items: [MOCK_ENTRY],
      totalCount: 2,
      hasMore: true,
      nextCursor: null,
    };
    const page2: UserNotificationPage = {
      items: [entry2],
      totalCount: 2,
      hasMore: false,
      nextCursor: null,
    };

    const client = createMockClient();
    vi.mocked(client.get)
      .mockResolvedValueOnce(axiosResponse(page1))
      .mockResolvedValueOnce(axiosResponse(page2));

    const { result } = renderHook(
      () =>
        useEntityActivityFeed({
          entityType: 'Patient',
          entityId: 'p-1',
          pageSize: 1,
        }),
      { wrapper: createWrapper(client) }
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.hasMore).toBe(true);

    await act(async () => {
      result.current.loadMore();
    });

    await waitFor(() => expect(result.current.loadingMore).toBe(false));
    expect(result.current.entries).toHaveLength(2);
    const data2 = result.current.entries[1]!.data as { title?: string };
    expect(data2.title).toBe('Deuxième entrée');
  });

  it('should use default pageSize when none is specified', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse(MOCK_FEED));

    const { result } = renderHook(
      () =>
        useEntityActivityFeed({
          entityType: 'Patient',
          entityId: 'p-1',
        }),
      { wrapper: createWrapper(client) }
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(client.get).toHaveBeenCalledWith(
      expect.stringContaining('notifications/entity/Patient/p-1'),
      expect.objectContaining({ params: expect.objectContaining({ pageSize: 20 }) })
    );
  });

  it('should refresh the feed', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse(MOCK_FEED));

    const { result } = renderHook(
      () =>
        useEntityActivityFeed({
          entityType: 'Patient',
          entityId: 'p-1',
        }),
      { wrapper: createWrapper(client) }
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    const updatedFeed: UserNotificationPage = {
      items: [{ ...MOCK_ENTRY, data: { title: 'Mis à jour' } }],
      totalCount: 1,
      hasMore: false,
      nextCursor: null,
    };
    vi.mocked(client.get).mockResolvedValue(axiosResponse(updatedFeed));

    await act(async () => {
      result.current.refresh();
    });

    await waitFor(() => expect(result.current.loading).toBe(false));
    const data = result.current.entries[0]!.data as { title?: string };
    expect(data.title).toBe('Mis à jour');
  });

  it('should use default basePath when config.basePath is undefined', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse(MOCK_FEED));

    const { result } = renderHook(
      () =>
        useEntityActivityFeed({
          entityType: 'Patient',
          entityId: 'p-1',
        }),
      { wrapper: createWrapperWithoutBasePath(client) }
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(client.get).toHaveBeenCalledWith(expect.stringContaining('/api'), expect.anything());
  });

  it('should report hasMore as false when all entries are loaded', async () => {
    const page: UserNotificationPage = {
      items: [MOCK_ENTRY],
      totalCount: 1,
      hasMore: false,
      nextCursor: null,
    };
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse(page));

    const { result } = renderHook(
      () =>
        useEntityActivityFeed({
          entityType: 'Patient',
          entityId: 'p-1',
          pageSize: 10,
        }),
      { wrapper: createWrapper(client) }
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.hasMore).toBe(false);
  });
});
