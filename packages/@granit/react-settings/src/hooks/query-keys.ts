import type { SettingsConfig } from '../providers/settings-provider';

/** Builds a consistent React Query key for settings operations. */
export function buildSettingsQueryKey(
  config: SettingsConfig,
  ...segments: readonly string[]
): readonly unknown[] {
  const prefix = config.queryKeyPrefix ?? ['settings'];
  return [...prefix, ...segments];
}
