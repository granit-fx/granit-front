import { createConfigProvider } from '@granit/react-api-client';

import type {
  GranitProviderConfig,
  GranitProviderProps,
  ResolvedGranitProviderConfig,
} from '@granit/react-api-client';

export const DEFAULT_SETTINGS_KEY_PREFIX = ['settings'] as const;

/** Configuration for the settings provider. */
export interface SettingsConfig extends GranitProviderConfig {
  /** Base path prefix before `/settings/...` (default: empty string). */
  readonly basePath?: string;
  readonly queryKeyPrefix?: readonly string[];
}

/**
 * SettingsConfig after the provider has resolved `client` from
 * `config.client` or the nearest `<GranitClientProvider>`, and defaulted
 * `basePath` and `queryKeyPrefix`.
 */
export interface ResolvedSettingsConfig extends ResolvedGranitProviderConfig<SettingsConfig> {
  readonly queryKeyPrefix: readonly string[];
}

export type SettingsProviderProps = GranitProviderProps<SettingsConfig>;

const { Provider, useConfig } = createConfigProvider<SettingsConfig, ResolvedSettingsConfig>({
  name: 'Settings',
  defaultBasePath: '',
  resolve: (base) => ({
    ...base,
    queryKeyPrefix: base.queryKeyPrefix ?? DEFAULT_SETTINGS_KEY_PREFIX,
  }),
});

/** Provides settings configuration to child components and hooks. */
export const SettingsProvider = Provider;

/** Returns the settings configuration from the nearest `SettingsProvider`. */
export const useSettingsConfig = useConfig;
