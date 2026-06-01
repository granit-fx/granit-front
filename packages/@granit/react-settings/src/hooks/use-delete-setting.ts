import { deleteSetting } from '@granit/settings';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { buildSettingsQueryKey, useSettingsConfig } from '../providers/settings-provider';

import type { SettingScope } from '@granit/settings';

export interface UseDeleteSettingReturn {
  readonly remove: (name: string) => void;
  readonly removeAsync: (name: string) => Promise<void>;
  readonly isPending: boolean;
  readonly error: Error | null;
}

/**
 * Mutation to delete (reset) a setting value.
 *
 * After deletion, the setting falls back to the next level in the cascade
 * (User → Tenant → Global → Config → Default).
 *
 * @example
 * ```tsx
 * const { remove } = useDeleteSetting('user');
 * remove(SETTING_NAMES.PREFERRED_CULTURE); // resets to tenant/global default
 * ```
 */
export function useDeleteSetting(scope: SettingScope): UseDeleteSettingReturn {
  const config = useSettingsConfig();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (name: string) => deleteSetting(config.client, config.basePath ?? '', scope, name),
    onSuccess: (_data, name) => {
      queryClient
        .invalidateQueries({ queryKey: buildSettingsQueryKey(config, scope) })
        .catch(() => undefined);
      queryClient
        .invalidateQueries({ queryKey: buildSettingsQueryKey(config, scope, name) })
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
