import { getSetting } from '@granit/settings';
import { useQuery } from '@tanstack/react-query';

import { useSettingsConfig } from '../providers/settings-provider';

import { buildSettingsQueryKey } from './query-keys';

import type { SettingScope, SettingValueResponse } from '@granit/settings';
import type { UseQueryResult } from '@tanstack/react-query';

/**
 * Get a single setting by name.
 *
 * @example
 * ```tsx
 * const { data } = useSetting('user', SETTING_NAMES.PREFERRED_CULTURE);
 * console.log(data?.value); // "fr"
 * ```
 */
export function useSetting(
  scope: SettingScope,
  name: string,
  options?: { enabled?: boolean }
): UseQueryResult<SettingValueResponse> {
  const config = useSettingsConfig();

  return useQuery({
    queryKey: buildSettingsQueryKey(config, scope, name),
    queryFn: () => getSetting(config.client, config.basePath, scope, name),
    enabled: options?.enabled ?? true,
  });
}
