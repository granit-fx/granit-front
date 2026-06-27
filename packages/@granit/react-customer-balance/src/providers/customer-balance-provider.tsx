import { createConfigProvider } from '@granit/react-api-client';

import { DEFAULT_BASE_PATH } from '../constants';

import type {
  GranitProviderConfig,
  GranitProviderProps,
  ResolvedGranitProviderConfig,
} from '@granit/react-api-client';

/** Configuration for the customer-balance provider. */
export interface CustomerBalanceConfig extends GranitProviderConfig {
  readonly queryKeyPrefix?: readonly string[];
}

/**
 * CustomerBalanceConfig after the provider has resolved `client` from
 * `config.client` or the nearest `<GranitClientProvider>`.
 */
export type ResolvedCustomerBalanceConfig = ResolvedGranitProviderConfig<CustomerBalanceConfig>;

export type CustomerBalanceProviderProps = GranitProviderProps<CustomerBalanceConfig>;

const { Provider, useConfig } = createConfigProvider<CustomerBalanceConfig>({
  name: 'CustomerBalance',
  defaultBasePath: DEFAULT_BASE_PATH,
});

/** Provides customer-balance configuration to child components and hooks. */
export const CustomerBalanceProvider = Provider;

/** Returns the customer-balance configuration from the nearest `CustomerBalanceProvider`. */
export const useCustomerBalanceConfig = useConfig;

/** Builds a consistent React Query key for customer-balance operations. */
export function buildCustomerBalanceQueryKey(
  config: CustomerBalanceConfig,
  ...segments: readonly (string | number)[]
): readonly unknown[] {
  const prefix = config.queryKeyPrefix ?? ['customer-balance'];
  return [...prefix, ...segments];
}
