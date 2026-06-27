import { createConfigProvider } from '@granit/react-api-client';

import { DEFAULT_BASE_PATH } from '../constants';

import type {
  GranitProviderConfig,
  GranitProviderProps,
  ResolvedGranitProviderConfig,
} from '@granit/react-api-client';

export interface PrivacyConfig extends GranitProviderConfig {
  readonly queryKeyPrefix?: readonly string[];
}

/**
 * PrivacyConfig after the provider has resolved `client` from
 * `config.client` or the nearest `<GranitClientProvider>`.
 */
export type ResolvedPrivacyConfig = ResolvedGranitProviderConfig<PrivacyConfig>;

export type PrivacyProviderProps = GranitProviderProps<PrivacyConfig>;

const DEFAULT_KEY_PREFIX = ['privacy'] as const;

const { Provider, useConfig } = createConfigProvider<PrivacyConfig>({
  name: 'Privacy',
  defaultBasePath: DEFAULT_BASE_PATH,
  resolve: (base) => ({
    ...base,
    queryKeyPrefix: base.queryKeyPrefix ?? DEFAULT_KEY_PREFIX,
  }),
});

export const PrivacyProvider = Provider;
export const usePrivacyConfig = useConfig;

export function buildPrivacyQueryKey(
  config: PrivacyConfig,
  ...segments: readonly string[]
): readonly unknown[] {
  return [...(config.queryKeyPrefix ?? DEFAULT_KEY_PREFIX), ...segments];
}
