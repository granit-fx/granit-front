import { updateSetting } from '@granit/settings';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { useSettingsConfig } from '../providers/settings-provider';

import { buildSettingsQueryKey } from './query-keys';

import type { SettingScope } from '@granit/settings';

export interface UseUpdateSettingReturn {
  readonly update: (name: string, value: string | null) => void;
  readonly updateAsync: (name: string, value: string | null) => Promise<void>;
  readonly isPending: boolean;
  readonly error: Error | null;
}

/**
 * Mutation to create/update a setting value.
 *
 * Automatically invalidates the scope query key and the individual setting key
 * on success.
 *
 * @example
 * ```tsx
 * const { update } = useUpdateSetting('user');
 * update(SETTING_NAMES.PREFERRED_CULTURE, 'en');
 * ```
 */
export function useUpdateSetting(scope: SettingScope): UseUpdateSettingReturn {
  const config = useSettingsConfig();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({ name, value }: { name: string; value: string | null }) =>
      updateSetting(config.client, config.basePath, scope, name, { value }),
    onSuccess: (_data, { name }) => {
      queryClient
        .invalidateQueries({ queryKey: buildSettingsQueryKey(config, scope) })
        .catch(() => undefined);
      queryClient
        .invalidateQueries({ queryKey: buildSettingsQueryKey(config, scope, name) })
        .catch(() => undefined);
    },
  });

  const update = useCallback(
    (name: string, value: string | null) => {
      mutation.mutate({ name, value });
    },
    [mutation]
  );

  const updateAsync = useCallback(
    async (name: string, value: string | null) => {
      await mutation.mutateAsync({ name, value });
    },
    [mutation]
  );

  return {
    update,
    updateAsync,
    isPending: mutation.isPending,
    error: mutation.error,
  };
}
