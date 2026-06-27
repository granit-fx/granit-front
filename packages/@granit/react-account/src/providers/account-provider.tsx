import { createConfigProvider } from '@granit/react-api-client';

import { DEFAULT_BASE_PATH } from '../constants';

import type { AxiosInstance } from '@granit/api-client';
import type { GranitProviderConfig, GranitProviderProps } from '@granit/react-api-client';

export interface AccountConfig extends GranitProviderConfig {
  readonly queryKeyPrefix?: readonly string[];
}

/**
 * AccountConfig after the provider has resolved `client` from
 * `config.client` or the nearest `<GranitClientProvider>`.
 */
export interface ResolvedAccountConfig extends AccountConfig {
  readonly client: AxiosInstance;
}

export type AccountProviderProps = GranitProviderProps<AccountConfig>;

const DEFAULT_KEY_PREFIX = ['account'] as const;

interface FullyResolvedAccountConfig extends ResolvedAccountConfig {
  readonly basePath: string;
  readonly queryKeyPrefix: readonly string[];
}

export function buildAccountQueryKey(
  config: AccountConfig,
  ...segments: readonly string[]
): readonly unknown[] {
  return [...(config.queryKeyPrefix ?? DEFAULT_KEY_PREFIX), ...segments];
}

const { Provider, useConfig } = createConfigProvider<AccountConfig, FullyResolvedAccountConfig>({
  name: 'Account',
  defaultBasePath: DEFAULT_BASE_PATH,
  resolve: (base) => ({
    ...base,
    queryKeyPrefix: base.queryKeyPrefix ?? DEFAULT_KEY_PREFIX,
  }),
});

export const AccountProvider = Provider;

export const useAccountConfig: () => ResolvedAccountConfig = useConfig;
