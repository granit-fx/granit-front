import { getAdminAppSettings, saveAdminAppSettings } from '@granit/settings';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { buildSettingsQueryKey, useSettingsConfig } from '../providers/settings-provider.js';

import type { AdminAppSetting } from '@granit/settings';
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';

/**
 * Get all application settings with admin metadata.
 */
export function useAdminAppSettings(options?: {
  enabled?: boolean;
}): UseQueryResult<AdminAppSetting[]> {
  const config = useSettingsConfig();

  return useQuery({
    queryKey: buildSettingsQueryKey(config, 'admin', 'settings'),
    queryFn: () => getAdminAppSettings(config.client, config.basePath ?? ''),
    enabled: options?.enabled ?? true,
    staleTime: 5 * 60 * 1000,
  });
}

export type SaveAppSettingsVariables = ReadonlyArray<{ key: string; value: string }>;

/**
 * Batch-update application settings.
 * Invalidates admin settings queries on success.
 */
export function useSaveAdminAppSettings(): UseMutationResult<
  void,
  Error,
  SaveAppSettingsVariables
> {
  const config = useSettingsConfig();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (settings: SaveAppSettingsVariables) =>
      saveAdminAppSettings(config.client, config.basePath ?? '', [...settings]),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: buildSettingsQueryKey(config, 'admin', 'settings'),
      });
    },
  });
}
