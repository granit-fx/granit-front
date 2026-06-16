import { getPreferences, updatePreference } from '@granit/notifications';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { API_BASE_PATH } from '../constants';
import { useNotificationConfig } from '../providers/notification-provider';

import type {
  NotificationPreferenceResponse,
  NotificationPreferenceUpdateRequest,
} from '@granit/notifications';

export interface UseNotificationPreferencesReturn {
  preferences: readonly NotificationPreferenceResponse[];
  loading: boolean;
  error: Error | null;
  saving: boolean;
  togglePreference: (preferenceId: string, enabled: boolean) => void;
  refresh: () => void;
}

const PREFERENCES_KEY = ['notifications', 'preferences'] as const;

interface ToggleVars {
  preferenceId: string;
  notificationTypeName: string;
  channelName: string;
  enabled: boolean;
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

  const {
    data: preferences = [],
    isLoading: loading,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: PREFERENCES_KEY,
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
      await queryClient.cancelQueries({ queryKey: PREFERENCES_KEY });
      const previous =
        queryClient.getQueryData<readonly NotificationPreferenceResponse[]>(PREFERENCES_KEY);
      queryClient.setQueryData<readonly NotificationPreferenceResponse[]>(
        PREFERENCES_KEY,
        (old = []) => old.map((p) => (p.id === preferenceId ? { ...p, isEnabled: enabled } : p))
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(PREFERENCES_KEY, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: PREFERENCES_KEY });
    },
  });

  const togglePreference = useCallback(
    (preferenceId: string, enabled: boolean) => {
      const pref = (
        queryClient.getQueryData<readonly NotificationPreferenceResponse[]>(PREFERENCES_KEY) ?? []
      ).find((p) => p.id === preferenceId);
      if (!pref) return;
      mutation.mutate({
        preferenceId,
        notificationTypeName: pref.notificationTypeName,
        channelName: pref.channelName,
        enabled,
      });
    },
    [mutation, queryClient]
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
