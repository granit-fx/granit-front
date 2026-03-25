import { fetchPreferences, updatePreference } from '@granit/notifications';
import { useCallback, useEffect, useOptimistic, useRef, useState, useTransition } from 'react';

import { useNotificationContext } from '../providers/notification-provider.js';

import type { NotificationPreference } from '@granit/notifications';
import type { AxiosInstance } from 'axios';

export interface UseNotificationPreferencesReturn {
  preferences: NotificationPreference[];
  loading: boolean;
  error: Error | null;
  saving: boolean;
  togglePreference: (preferenceId: string, enabled: boolean) => void;
  refresh: () => void;
}

type OptimisticAction = {
  preferenceId: string;
  updated: NotificationPreference;
};

async function savePreference(
  apiClient: AxiosInstance,
  basePath: string,
  preferenceId: string,
  updated: NotificationPreference,
  mountedRef: React.RefObject<boolean>,
  setPreferences: React.Dispatch<React.SetStateAction<NotificationPreference[]>>,
  setError: React.Dispatch<React.SetStateAction<Error | null>>
): Promise<void> {
  try {
    const saved = await updatePreference(apiClient, basePath, updated);
    if (mountedRef.current) {
      setPreferences((prev) => prev.map((p) => (p.id === preferenceId ? saved : p)));
    }
  } catch (err) {
    // No manual rollback — useOptimistic reverts automatically when the
    // transition ends and setPreferences was not called with a new value.
    if (mountedRef.current) {
      setError(err instanceof Error ? err : new Error(String(err)));
    }
  }
}

/**
 * CRUD hook for notification preferences (flat rows: one per type x channel).
 *
 * Uses React 19 `useOptimistic` for instant UI feedback with automatic
 * rollback on server failure.
 */
export function useNotificationPreferences(): UseNotificationPreferencesReturn {
  const { config } = useNotificationContext();
  const basePath = config.basePath ?? '/api';

  const [preferences, setPreferences] = useState<NotificationPreference[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const mountedRef = useRef(true);

  const [optimisticPreferences, applyOptimistic] = useOptimistic(
    preferences,
    (state: NotificationPreference[], action: OptimisticAction) =>
      state.map((p) => (p.id === action.preferenceId ? action.updated : p))
  );

  const [saving, startTransition] = useTransition();

  const load = useCallback(async () => {
    try {
      const data = await fetchPreferences(config.apiClient, basePath);
      if (mountedRef.current) {
        setPreferences(data);
        setError(null);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [config.apiClient, basePath]);

  useEffect(() => {
    mountedRef.current = true;
    load();
    return () => {
      mountedRef.current = false;
    };
  }, [load]);

  const togglePreference = useCallback(
    (preferenceId: string, enabled: boolean) => {
      const pref = preferences.find((p) => p.id === preferenceId);
      if (!pref) return;

      const updated: NotificationPreference = {
        ...pref,
        isEnabled: enabled,
      };

      startTransition(async () => {
        applyOptimistic({ preferenceId, updated });
        await savePreference(
          config.apiClient,
          basePath,
          preferenceId,
          updated,
          mountedRef,
          setPreferences,
          setError
        );
      });
    },
    [config.apiClient, basePath, preferences, applyOptimistic]
  );

  const refresh = useCallback(() => {
    setLoading(true);
    load();
  }, [load]);

  return { preferences: optimisticPreferences, loading, error, saving, togglePreference, refresh };
}
