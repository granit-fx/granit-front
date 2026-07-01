import { getPreferences, updatePreference } from '@granit/notifications';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';

import { API_BASE_PATH } from '../constants';
import { useNotificationConfig } from '../providers/notifications-provider';

import { buildNotificationsQueryKey } from './query-keys';

import type {
  NotificationPreferenceResponse,
  NotificationPreferenceUpdateRequest,
} from '@granit/notifications';
import type { UseMutationResult } from '@tanstack/react-query';

export interface UseNotificationPreferencesReturn {
  preferences: readonly NotificationPreferenceResponse[];
  loading: boolean;
  error: Error | null;
  saving: boolean;
  togglePreference: (preferenceId: string, enabled: boolean) => void;
  refresh: () => void;
}

interface ToggleVars {
  preferenceId: string;
  notificationTypeName: string;
  channelName: string;
  enabled: boolean;
}

/**
 * Mutation hook that upserts a single notification preference row (one per type ×
 * channel). Use it to create a preference that does not exist yet, or to update
 * an existing one. Invalidates the preferences query on success so the panel
 * reflects the server-assigned row.
 *
 * `PUT {basePath}/notifications/preferences`
 */
export function useUpsertNotificationPreference(): UseMutationResult<
  void,
  Error,
  NotificationPreferenceUpdateRequest
> {
  const { config } = useNotificationConfig();
  const basePath = config.basePath ?? API_BASE_PATH;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: NotificationPreferenceUpdateRequest) =>
      updatePreference(config.apiClient, basePath, request),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: buildNotificationsQueryKey(config, 'preferences'),
      });
    },
  });
}

/**
 * CRUD hook for notification preferences (flat rows: one per type × channel).
 *
 * Uses TanStack Query for data fetching and cache-based optimistic updates with
 * automatic rollback on server failure.
 */
export function useNotificationPreferences(): UseNotificationPreferencesReturn {
  const { config } = useNotificationConfig();
  const basePath = config.basePath ?? API_BASE_PATH;
  const queryClient = useQueryClient();
  const preferencesKey = useMemo(() => buildNotificationsQueryKey(config, 'preferences'), [config]);

  const {
    data: preferences = [],
    isLoading: loading,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: preferencesKey,
    queryFn: () => getPreferences(config.apiClient, basePath),
  });

  const mutation = useMutation({
    mutationFn: ({ notificationTypeName, channelName, enabled }: ToggleVars) => {
      const req: NotificationPreferenceUpdateRequest = {
        notificationTypeName,
        channelName,
        isEnabled: enabled,
      };
      return updatePreference(config.apiClient, basePath, req);
    },
    onMutate: async ({ preferenceId, enabled }) => {
      await queryClient.cancelQueries({ queryKey: preferencesKey });
      const previous =
        queryClient.getQueryData<readonly NotificationPreferenceResponse[]>(preferencesKey);
      queryClient.setQueryData<readonly NotificationPreferenceResponse[]>(
        preferencesKey,
        (old = []) => old.map((p) => (p.id === preferenceId ? { ...p, isEnabled: enabled } : p))
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(preferencesKey, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: preferencesKey });
    },
  });

  const togglePreference = useCallback(
    (preferenceId: string, enabled: boolean) => {
      const pref = (
        queryClient.getQueryData<readonly NotificationPreferenceResponse[]>(preferencesKey) ?? []
      ).find((p) => p.id === preferenceId);
      if (!pref) return;
      mutation.mutate({
        preferenceId,
        notificationTypeName: pref.notificationTypeName,
        channelName: pref.channelName,
        enabled,
      });
    },
    [mutation, queryClient, preferencesKey]
  );

  const refresh = useCallback(() => {
    refetch();
  }, [refetch]);

  let error: Error | null = null;
  if (queryError) {
    error = queryError instanceof Error ? queryError : new Error(String(queryError));
  }

  return {
    preferences,
    loading,
    error,
    saving: mutation.isPending,
    togglePreference,
    refresh,
  };
}
