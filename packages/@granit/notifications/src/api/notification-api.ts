import { buildApiUrl } from '@granit/api-client';

import type {
  NotificationDefinition,
  NotificationPreferenceResponse,
  NotificationPreferenceUpdateRequest,
  NotificationSubscriptionResponse,
  UserNotificationPage,
} from '../types/index';
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
): Promise<UserNotificationPage> {
  const { data } = await client.get<UserNotificationPage>(
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
): Promise<NotificationPreferenceResponse[]> {
  const { data } = await client.get<NotificationPreferenceResponse[]>(
    buildApiUrl(basePath, 'notifications', 'preferences')
  );
  return data;
}

export async function updatePreference(
  client: AxiosInstance,
  basePath: string,
  request: NotificationPreferenceUpdateRequest
): Promise<void> {
  await client.put(buildApiUrl(basePath, 'notifications', 'preferences'), request);
}

// ---------------------------------------------------------------------------
// Notification type definitions
// ---------------------------------------------------------------------------

/**
 * Returns all notification types registered in the system with their metadata.
 *
 * `GET {basePath}/notifications/types`
 */
export async function listNotificationTypes(
  client: AxiosInstance,
  basePath: string
): Promise<readonly NotificationDefinition[]> {
  const { data } = await client.get<NotificationDefinition[]>(
    buildApiUrl(basePath, 'notifications', 'types')
  );
  return data;
}

// ---------------------------------------------------------------------------
// Subscriptions (notification type opt-in)
// ---------------------------------------------------------------------------

/**
 * Returns all notification type subscriptions for the current user.
 *
 * `GET {basePath}/notifications/subscriptions`
 */
export async function listSubscriptions(
  client: AxiosInstance,
  basePath: string
): Promise<readonly NotificationSubscriptionResponse[]> {
  const { data } = await client.get<NotificationSubscriptionResponse[]>(
    buildApiUrl(basePath, 'notifications', 'subscriptions')
  );
  return data;
}

/**
 * Subscribes the current user to a notification type. Idempotent.
 *
 * `POST {basePath}/notifications/subscriptions/{typeName}`
 */
export async function subscribeToNotificationType(
  client: AxiosInstance,
  basePath: string,
  typeName: string
): Promise<void> {
  await client.post(buildApiUrl(basePath, 'notifications', 'subscriptions', typeName));
}

/**
 * Unsubscribes the current user from a notification type. Idempotent.
 *
 * `DELETE {basePath}/notifications/subscriptions/{typeName}`
 */
export async function unsubscribeFromNotificationType(
  client: AxiosInstance,
  basePath: string,
  typeName: string
): Promise<void> {
  await client.delete(buildApiUrl(basePath, 'notifications', 'subscriptions', typeName));
}

// ---------------------------------------------------------------------------
// Entity followers
// ---------------------------------------------------------------------------

/**
 * Subscribes the current user as a follower of an entity. Idempotent.
 *
 * `POST {basePath}/notifications/entity/{entityType}/{entityId}/follow`
 */
export async function followEntity(
  client: AxiosInstance,
  basePath: string,
  entityType: string,
  entityId: string
): Promise<void> {
  await client.post(
    buildApiUrl(basePath, 'notifications', 'entity', entityType, entityId, 'follow')
  );
}

/**
 * Removes the current user from the follower list of an entity. Idempotent.
 *
 * `DELETE {basePath}/notifications/entity/{entityType}/{entityId}/follow`
 */
export async function unfollowEntity(
  client: AxiosInstance,
  basePath: string,
  entityType: string,
  entityId: string
): Promise<void> {
  await client.delete(
    buildApiUrl(basePath, 'notifications', 'entity', entityType, entityId, 'follow')
  );
}

/**
 * Returns all followers of a specific entity.
 *
 * `GET {basePath}/notifications/entity/{entityType}/{entityId}/followers`
 */
export async function listEntityFollowers(
  client: AxiosInstance,
  basePath: string,
  entityType: string,
  entityId: string
): Promise<readonly NotificationSubscriptionResponse[]> {
  const { data } = await client.get<NotificationSubscriptionResponse[]>(
    buildApiUrl(basePath, 'notifications', 'entity', entityType, entityId, 'followers')
  );
  return data;
}
