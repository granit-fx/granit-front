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
import { logger } from '../logger';
import { useNotificationConfig } from '../providers/notifications-provider';

import { buildNotificationsQueryKey } from './query-keys';

import type {
  NotificationDefinition,
  NotificationSubscriptionResponse,
} from '@granit/notifications';
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';

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
    queryKey: buildNotificationsQueryKey(config, 'types'),
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
    queryKey: buildNotificationsQueryKey(config, 'subscriptions'),
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
    onSuccess: (_data, typeName) => {
      logger.debug('Subscribed to notification type', { typeName });
      queryClient.invalidateQueries({
        queryKey: buildNotificationsQueryKey(config, 'subscriptions'),
      });
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
    onSuccess: (_data, typeName) => {
      logger.debug('Unsubscribed from notification type', { typeName });
      queryClient.invalidateQueries({
        queryKey: buildNotificationsQueryKey(config, 'subscriptions'),
      });
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
      logger.debug('Followed entity', { entityType, entityId });
      queryClient.invalidateQueries({
        queryKey: buildNotificationsQueryKey(config, 'entity', entityType, entityId, 'followers'),
      });
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
      logger.debug('Unfollowed entity', { entityType, entityId });
      queryClient.invalidateQueries({
        queryKey: buildNotificationsQueryKey(config, 'entity', entityType, entityId, 'followers'),
      });
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
    queryKey: buildNotificationsQueryKey(config, 'entity', entityType, entityId, 'followers'),
    queryFn: () => listEntityFollowers(config.apiClient, basePath, entityType, entityId),
    enabled: Boolean(entityType) && Boolean(entityId),
  });
}
