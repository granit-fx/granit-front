import { getAdminAppSettings, saveAdminAppSettings } from '@granit/settings';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { buildSettingsQueryKey, useSettingsConfig } from '../providers/settings-provider.js';

import type {
  AdminAppSetting,
  AdminSettingsScope,
  BulkSettingEntry,
  BulkUpdateSettingsResponse,
} from '@granit/settings';
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';

/**
 * Fetch the admin-settings catalog for a scope.
 *
 * `GET {basePath}/settings/{scope}/definitions`
 *
 * Each returned entry carries `valueKind`, `allowedValues`, `isEncrypted`, the
 * resolved current `value` and the baseline `defaultValue` — enough for the
 * admin UI to render a typed control without a second round-trip.
 */
export function useAdminAppSettings(
  scope: AdminSettingsScope,
  options?: { enabled?: boolean }
): UseQueryResult<AdminAppSetting[]> {
  const config = useSettingsConfig();

  return useQuery({
    queryKey: buildSettingsQueryKey(config, 'admin', 'definitions', scope),
    queryFn: () => getAdminAppSettings(config.client, config.basePath ?? '', scope),
    enabled: options?.enabled ?? true,
    staleTime: 5 * 60 * 1000,
  });
}

export type SaveAppSettingsVariables = readonly BulkSettingEntry[];

/**
 * Batch-update admin settings for a scope.
 *
 * `PUT {basePath}/settings/{scope}/bulk`
 *
 * Resolves to the per-entry `BulkUpdateSettingsResponse` envelope — the caller
 * is responsible for surfacing non-`Updated` outcomes. Invalidates the
 * corresponding definitions cache on success.
 */
export function useSaveAdminAppSettings(
  scope: AdminSettingsScope
): UseMutationResult<BulkUpdateSettingsResponse, Error, SaveAppSettingsVariables> {
  const config = useSettingsConfig();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (settings: SaveAppSettingsVariables) =>
      saveAdminAppSettings(config.client, config.basePath ?? '', scope, settings),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: buildSettingsQueryKey(config, 'admin', 'definitions', scope),
      });
      // Also invalidate the flat scope read used by non-admin consumers.
      queryClient.invalidateQueries({
        queryKey: buildSettingsQueryKey(config, scope),
      });
    },
  });
}
