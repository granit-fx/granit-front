import { buildApiUrl } from '@granit/api-client';

import type {
  ActivityFeedPage,
  UserNotificationPage,
  NotificationPreference,
} from '../types/index.js';
import type { AxiosInstance } from '@granit/api-client';
import type { PaginationParams } from '@granit/query-engine';

// ---------------------------------------------------------------------------
// Notifications (inbox)
// ---------------------------------------------------------------------------

export async function listNotifications(
  client: AxiosInstance,
  basePath: string,
  params: PaginationParams = {}
): Promise<UserNotificationPage> {
  const { data } = await client.get<UserNotificationPage>(buildApiUrl(basePath, 'notifications'), {
    params,
  });
  return data;
}

export async function markAsRead(
  client: AxiosInstance,
  basePath: string,
  notificationId: string
): Promise<void> {
  await client.post(buildApiUrl(basePath, 'notifications', notificationId, 'read'));
}

export async function markAllAsRead(client: AxiosInstance, basePath: string): Promise<void> {
  await client.post(buildApiUrl(basePath, 'notifications', 'read-all'));
}

// ---------------------------------------------------------------------------
// Unread count
// ---------------------------------------------------------------------------

export async function getUnreadCount(client: AxiosInstance, basePath: string): Promise<number> {
  const { data } = await client.get<{ count: number }>(
    buildApiUrl(basePath, 'notifications', 'unread', 'count')
  );
  return data.count;
}

// ---------------------------------------------------------------------------
// Activity feed (entity-scoped)
// ---------------------------------------------------------------------------

export async function getEntityActivityFeed(
  client: AxiosInstance,
  basePath: string,
  entityType: string,
  entityId: string,
  params: PaginationParams = {}
): Promise<ActivityFeedPage> {
  const { data } = await client.get<ActivityFeedPage>(
    buildApiUrl(basePath, 'notifications', 'entity', entityType, entityId),
    { params }
  );
  return data;
}

// ---------------------------------------------------------------------------
// Preferences
// ---------------------------------------------------------------------------

export async function getPreferences(
  client: AxiosInstance,
  basePath: string
): Promise<NotificationPreference[]> {
  const { data } = await client.get<NotificationPreference[]>(
    buildApiUrl(basePath, 'notifications', 'preferences')
  );
  return data;
}

export async function updatePreference(
  client: AxiosInstance,
  basePath: string,
  preference: NotificationPreference
): Promise<NotificationPreference> {
  const { data } = await client.put<NotificationPreference>(
    buildApiUrl(basePath, 'notifications', 'preferences'),
    preference
  );
  return data;
}
