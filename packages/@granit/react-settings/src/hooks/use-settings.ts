import { getSettings } from '@granit/settings';
import { useQuery } from '@tanstack/react-query';

import { useSettingsConfig } from '../providers/settings-provider';

import { buildSettingsQueryKey } from './query-keys';

import type { SettingScope, SettingsMap } from '@granit/settings';
import type { UseQueryResult } from '@tanstack/react-query';

/**
 * Get all visible settings for a scope.
 *
 * @example
 * ```tsx
 * const { data: settings } = useSettings('user');
 * const culture = settings?.['Granit.Localization.PreferredCulture'];
 * ```
 */
export function useSettings(
  scope: SettingScope,
  options?: { enabled?: boolean }
): UseQueryResult<SettingsMap> {
  const config = useSettingsConfig();

  return useQuery({
    queryKey: buildSettingsQueryKey(config, scope),
    queryFn: () => getSettings(config.client, config.basePath, scope),
    enabled: options?.enabled ?? true,
  });
}
