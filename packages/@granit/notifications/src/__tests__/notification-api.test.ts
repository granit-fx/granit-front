import { axiosResponse, createMockClient } from '@granit/api-client/test-utils';
import { toEntityId } from '@granit/types';
import { describe, expect, it, vi } from 'vitest';

import {
  getEntityActivityFeed,
  listNotifications,
  getPreferences,
  getUnreadCount,
  markAllAsRead,
  markAsRead,
  updatePreference,
} from '../api/notification-api.js';

import type {
  ActivityFeedPage,
  UserNotificationPage,
  NotificationPreference,
} from '../types/index.js';

describe('notification-api', () => {
  // -----------------------------------------------------------------------
  // listNotifications
  // -----------------------------------------------------------------------
  it('should send GET with pagination params (listNotifications)', async () => {
    const page: UserNotificationPage = {
      items: [],
      totalCount: 0,
      nextCursor: null,
      unreadCount: 0,
    };
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse(page));

    const result = await listNotifications(client, '/api/v1', { page: 1, pageSize: 10 });

    expect(client.get).toHaveBeenCalledWith('/api/v1/notifications', {
      params: { page: 1, pageSize: 10 },
    });
    expect(result).toEqual(page);
  });

  // -----------------------------------------------------------------------
  // markAsRead
  // -----------------------------------------------------------------------
  it('should send POST to the correct URL (markAsRead)', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockResolvedValue(axiosResponse(undefined));

    await markAsRead(client, '/api/v1', 'n-1');

    expect(client.post).toHaveBeenCalledWith('/api/v1/notifications/n-1/read');
  });

  // -----------------------------------------------------------------------
  // markAllAsRead
  // -----------------------------------------------------------------------
  it('should send POST to read-all (markAllAsRead)', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockResolvedValue(axiosResponse(undefined));

    await markAllAsRead(client, '/api/v1');

    expect(client.post).toHaveBeenCalledWith('/api/v1/notifications/read-all');
  });

  // -----------------------------------------------------------------------
  // getUnreadCount
  // -----------------------------------------------------------------------
  it('should return the count number (getUnreadCount)', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse({ count: 42 }));

    const result = await getUnreadCount(client, '/api/v1');

    expect(client.get).toHaveBeenCalledWith('/api/v1/notifications/unread/count');
    expect(result).toBe(42);
  });

  // -----------------------------------------------------------------------
  // getEntityActivityFeed
  // -----------------------------------------------------------------------
  it('should send GET with entity path (getEntityActivityFeed)', async () => {
    const page: ActivityFeedPage = { items: [], totalCount: 0, nextCursor: null };
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse(page));

    const result = await getEntityActivityFeed(client, '/api/v1', 'Patient', 'p-1', {
      page: 1,
      pageSize: 5,
    });

    expect(client.get).toHaveBeenCalledWith('/api/v1/notifications/entity/Patient/p-1', {
      params: { page: 1, pageSize: 5 },
    });
    expect(result).toEqual(page);
  });

  // -----------------------------------------------------------------------
  // getPreferences
  // -----------------------------------------------------------------------
  it('should send GET for preferences (getPreferences)', async () => {
    const prefs: NotificationPreference[] = [];
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse(prefs));

    const result = await getPreferences(client, '/api/v1');

    expect(client.get).toHaveBeenCalledWith('/api/v1/notifications/preferences');
    expect(result).toEqual([]);
  });

  // -----------------------------------------------------------------------
  // updatePreference
  // -----------------------------------------------------------------------
  it('should send PUT with preference data (updatePreference)', async () => {
    const pref: NotificationPreference = {
      id: toEntityId<'NotificationPreference'>('pref-1'),
      userId: toEntityId<'User'>('u-1'),
      notificationTypeName: 'AppointmentReminder',
      channelName: 'InApp',
      isEnabled: true,
    };
    const client = createMockClient();
    vi.mocked(client.put).mockResolvedValue(axiosResponse(pref));

    const result = await updatePreference(client, '/api/v1', pref);

    expect(client.put).toHaveBeenCalledWith('/api/v1/notifications/preferences', pref);
    expect(result).toEqual(pref);
  });
});
