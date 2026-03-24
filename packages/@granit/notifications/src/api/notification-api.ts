import type {
  ActivityFeedPage,
  UserNotification,
  UserNotificationPage,
  NotificationPreference,
} from '../types/index.js';
import type { PaginationParams } from '@granit/query-engine';
import type { AxiosInstance } from 'axios';

function buildUrl(basePath: string, ...segments: string[]): string {
  return [basePath, ...segments].join('/');
}

// ---------------------------------------------------------------------------
// Notifications (inbox)
// ---------------------------------------------------------------------------

export async function fetchNotifications(
  client: AxiosInstance,
  basePath: string,
  params: PaginationParams = {}
): Promise<UserNotificationPage> {
  const { data } = await client.get<UserNotificationPage>(buildUrl(basePath, 'notifications'), {
    params,
  });
  return data;
}

export async function markAsRead(
  client: AxiosInstance,
  basePath: string,
  notificationId: string
): Promise<UserNotification> {
  const { data } = await client.post<UserNotification>(
    buildUrl(basePath, 'notifications', notificationId, 'read')
  );
  return data;
}

export async function markAllAsRead(client: AxiosInstance, basePath: string): Promise<void> {
  await client.post(buildUrl(basePath, 'notifications', 'read-all'));
}

// ---------------------------------------------------------------------------
// Unread count
// ---------------------------------------------------------------------------

export async function fetchUnreadCount(client: AxiosInstance, basePath: string): Promise<number> {
  const { data } = await client.get<{ count: number }>(
    buildUrl(basePath, 'notifications', 'unread', 'count')
  );
  return data.count;
}

// ---------------------------------------------------------------------------
// Activity feed (entity-scoped)
// ---------------------------------------------------------------------------

export async function fetchEntityActivityFeed(
  client: AxiosInstance,
  basePath: string,
  entityType: string,
  entityId: string,
  params: PaginationParams = {}
): Promise<ActivityFeedPage> {
  const { data } = await client.get<ActivityFeedPage>(
    buildUrl(basePath, 'notifications', 'entity', entityType, entityId),
    { params }
  );
  return data;
}

// ---------------------------------------------------------------------------
// Preferences
// ---------------------------------------------------------------------------

export async function fetchPreferences(
  client: AxiosInstance,
  basePath: string
): Promise<NotificationPreference[]> {
  const { data } = await client.get<NotificationPreference[]>(
    buildUrl(basePath, 'notifications', 'preferences')
  );
  return data;
}

export async function updatePreference(
  client: AxiosInstance,
  basePath: string,
  preference: NotificationPreference
): Promise<NotificationPreference> {
  const { data } = await client.put<NotificationPreference>(
    buildUrl(basePath, 'notifications', 'preferences'),
    preference
  );
  return data;
}
