import {
  followEntity,
  listEntityFollowers,
  listNotificationTypes,
  listSubscriptions,
  subscribeToNotificationType,
  unfollowEntity,
  unsubscribeFromNotificationType,
} from '@granit/notifications';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { API_BASE_PATH } from '../constants';
import { useNotificationConfig } from '../providers/notification-provider';

import type {
  NotificationDefinition,
  NotificationSubscriptionResponse,
} from '@granit/notifications';
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

const NOTIFICATION_TYPES_KEY = ['notifications', 'types'] as const;
const SUBSCRIPTIONS_KEY = ['notifications', 'subscriptions'] as const;
const ENTITY_FOLLOWERS_KEY = (entityType: string, entityId: string) =>
  ['notifications', 'entity', entityType, entityId, 'followers'] as const;

// ---------------------------------------------------------------------------
// Notification types — the registry of available notifications
// ---------------------------------------------------------------------------

/**
 * Returns all notification types registered in the system. Use this to build
 * the preferences UI (which types exist, their default channels, group, etc.).
 *
 * `GET /api/v1/notifications/types`
 */
export function useNotificationTypes(): UseQueryResult<readonly NotificationDefinition[]> {
  const { config } = useNotificationConfig();
  const basePath = config.basePath ?? API_BASE_PATH;
  return useQuery({
    queryKey: NOTIFICATION_TYPES_KEY,
    queryFn: () => listNotificationTypes(config.apiClient, basePath),
    staleTime: 5 * 60_000,
  });
}

// ---------------------------------------------------------------------------
// Subscriptions (per notification type)
// ---------------------------------------------------------------------------

/**
 * Returns all notification subscriptions for the current user.
 *
 * `GET /api/v1/notifications/subscriptions`
 */
export function useNotificationSubscriptions(): UseQueryResult<
  readonly NotificationSubscriptionResponse[]
> {
  const { config } = useNotificationConfig();
  const basePath = config.basePath ?? API_BASE_PATH;
  return useQuery({
    queryKey: SUBSCRIPTIONS_KEY,
    queryFn: () => listSubscriptions(config.apiClient, basePath),
  });
}

/**
 * Subscribes the current user to a notification type. Idempotent.
 *
 * `POST /api/v1/notifications/subscriptions/{typeName}`
 */
export function useSubscribeToNotificationType(): UseMutationResult<void, Error, string> {
  const { config } = useNotificationConfig();
  const basePath = config.basePath ?? API_BASE_PATH;
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (typeName) => subscribeToNotificationType(config.apiClient, basePath, typeName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SUBSCRIPTIONS_KEY });
    },
  });
}

/**
 * Unsubscribes the current user from a notification type. Idempotent.
 *
 * `DELETE /api/v1/notifications/subscriptions/{typeName}`
 */
export function useUnsubscribeFromNotificationType(): UseMutationResult<void, Error, string> {
  const { config } = useNotificationConfig();
  const basePath = config.basePath ?? API_BASE_PATH;
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (typeName) => unsubscribeFromNotificationType(config.apiClient, basePath, typeName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SUBSCRIPTIONS_KEY });
    },
  });
}

// ---------------------------------------------------------------------------
// Entity followers
// ---------------------------------------------------------------------------

/** Variables for {@link useFollowEntity} / {@link useUnfollowEntity}. */
export interface EntityFollowVariables {
  readonly entityType: string;
  readonly entityId: string;
}

/**
 * Subscribes the current user as a follower of an entity. Idempotent.
 *
 * `POST /api/v1/notifications/entity/{entityType}/{entityId}/follow`
 */
export function useFollowEntity(): UseMutationResult<void, Error, EntityFollowVariables> {
  const { config } = useNotificationConfig();
  const basePath = config.basePath ?? API_BASE_PATH;
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ entityType, entityId }) =>
      followEntity(config.apiClient, basePath, entityType, entityId),
    onSuccess: (_data, { entityType, entityId }) => {
      queryClient.invalidateQueries({ queryKey: ENTITY_FOLLOWERS_KEY(entityType, entityId) });
    },
  });
}

/**
 * Removes the current user from the follower list of an entity. Idempotent.
 *
 * `DELETE /api/v1/notifications/entity/{entityType}/{entityId}/follow`
 */
export function useUnfollowEntity(): UseMutationResult<void, Error, EntityFollowVariables> {
  const { config } = useNotificationConfig();
  const basePath = config.basePath ?? API_BASE_PATH;
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ entityType, entityId }) =>
      unfollowEntity(config.apiClient, basePath, entityType, entityId),
    onSuccess: (_data, { entityType, entityId }) => {
      queryClient.invalidateQueries({ queryKey: ENTITY_FOLLOWERS_KEY(entityType, entityId) });
    },
  });
}

/**
 * Returns all followers of a specific entity.
 *
 * `GET /api/v1/notifications/entity/{entityType}/{entityId}/followers`
 */
export function useEntityFollowers(
  entityType: string,
  entityId: string
): UseQueryResult<readonly NotificationSubscriptionResponse[]> {
  const { config } = useNotificationConfig();
  const basePath = config.basePath ?? API_BASE_PATH;
  return useQuery({
    queryKey: ENTITY_FOLLOWERS_KEY(entityType, entityId),
    queryFn: () => listEntityFollowers(config.apiClient, basePath, entityType, entityId),
    enabled: Boolean(entityType) && Boolean(entityId),
  });
}
