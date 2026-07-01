import { deleteSetting } from '@granit/settings';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { useSettingsConfig } from '../providers/settings-provider';

import { buildSettingsQueryKey } from './query-keys';

export interface UseDeleteSettingReturn {
  readonly remove: (name: string) => void;
  readonly removeAsync: (name: string) => Promise<void>;
  readonly isPending: boolean;
  readonly error: Error | null;
}

/**
 * Mutation to delete (reset) a user-level setting value.
 *
 * After deletion, the setting falls back to the next level in the cascade
 * (Tenant → Global → Config → Default). Only valid for the user scope —
 * to clear a global or tenant setting use `useUpdateSetting` with `null`.
 *
 * @example
 * ```tsx
 * const { remove } = useDeleteSetting();
 * remove(SETTING_NAMES.PREFERRED_CULTURE); // resets to tenant/global default
 * ```
 */
export function useDeleteSetting(): UseDeleteSettingReturn {
  const config = useSettingsConfig();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (name: string) => deleteSetting(config.client, config.basePath, 'user', name),
    onSuccess: (_data, name) => {
      queryClient
        .invalidateQueries({ queryKey: buildSettingsQueryKey(config, 'user') })
        .catch(() => undefined);
      queryClient
        .invalidateQueries({ queryKey: buildSettingsQueryKey(config, 'user', name) })
        .catch(() => undefined);
    },
  });

  const remove = useCallback(
    (name: string) => {
      mutation.mutate(name);
    },
    [mutation]
  );

  const removeAsync = useCallback(
    async (name: string) => {
      await mutation.mutateAsync(name);
    },
    [mutation]
  );

  return {
    remove,
    removeAsync,
    isPending: mutation.isPending,
    error: mutation.error,
  };
}
