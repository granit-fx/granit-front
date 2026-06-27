import { createConfigProvider } from '@granit/react-api-client';

import { DEFAULT_BASE_PATH } from '../constants';

import type {
  GranitProviderConfig,
  GranitProviderProps,
  ResolvedGranitProviderConfig,
} from '@granit/react-api-client';

export interface TenantAdminConfig extends GranitProviderConfig {
  readonly queryKeyPrefix?: readonly string[];
}

/**
 * TenantAdminConfig after the provider has resolved `client` from
 * `config.client` or the nearest `<GranitClientProvider>`.
 */
export type ResolvedTenantAdminConfig = ResolvedGranitProviderConfig<TenantAdminConfig>;

export type TenantAdminProviderProps = GranitProviderProps<TenantAdminConfig>;

const DEFAULT_KEY_PREFIX = ['tenant-admin'] as const;

const { Provider, useConfig } = createConfigProvider<TenantAdminConfig>({
  name: 'TenantAdmin',
  defaultBasePath: DEFAULT_BASE_PATH,
  resolve: (base) => ({
    ...base,
    queryKeyPrefix: base.queryKeyPrefix ?? DEFAULT_KEY_PREFIX,
  }),
});

export const TenantAdminProvider = Provider;
export const useTenantAdminConfig = useConfig;

export function buildTenantAdminQueryKey(
  config: TenantAdminConfig,
  ...segments: readonly string[]
): readonly unknown[] {
  return [...(config.queryKeyPrefix ?? DEFAULT_KEY_PREFIX), ...segments];
}
