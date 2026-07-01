import { DEFAULT_SETTINGS_KEY_PREFIX } from '../providers/settings-provider';

import type { SettingsConfig } from '../providers/settings-provider';

/** Builds a consistent React Query key for settings operations. */
export function buildSettingsQueryKey(
  config: SettingsConfig,
  ...segments: readonly string[]
): readonly unknown[] {
  const prefix = config.queryKeyPrefix ?? DEFAULT_SETTINGS_KEY_PREFIX;
  return [...prefix, ...segments];
}
