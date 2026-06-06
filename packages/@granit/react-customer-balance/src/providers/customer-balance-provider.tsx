import { useOptionalGranitClient } from '@granit/react-api-client';
import { createContext, useContext, useMemo } from 'react';

import { DEFAULT_BASE_PATH } from '../constants';

import type { AxiosInstance } from '@granit/api-client';
import type { ReactNode } from 'react';

/** Configuration for the customer-balance provider. */
export interface CustomerBalanceConfig {
  readonly client?: AxiosInstance;
  /** Base path for customer-balance endpoints (default: `/api/v1/customer-balance`). */
  readonly basePath?: string;
  readonly queryKeyPrefix?: readonly string[];
}

/**
 * CustomerBalanceConfig after the provider has resolved `client` from
 * `config.client` or the nearest `<GranitClientProvider>`.
 */
export interface ResolvedCustomerBalanceConfig extends CustomerBalanceConfig {
  readonly client: AxiosInstance;
}

export interface CustomerBalanceProviderProps {
  readonly config: CustomerBalanceConfig;
  readonly children: ReactNode;
}

const CustomerBalanceConfigContext = createContext<ResolvedCustomerBalanceConfig | null>(null);

/** Provides customer-balance configuration to child components and hooks. */
export function CustomerBalanceProvider({
  config,
  children,
}: Readonly<CustomerBalanceProviderProps>) {
  const contextClient = useOptionalGranitClient();
  const value = useMemo<ResolvedCustomerBalanceConfig>(() => {
    const client = config.client ?? contextClient;
    if (!client) {
      throw new Error(
        'CustomerBalanceProvider requires an Axios client. Provide it via config.client or wrap your app in a <GranitClientProvider>.'
      );
    }
    return {
      ...config,
      basePath: config.basePath ?? DEFAULT_BASE_PATH,
      client,
    };
  }, [config, contextClient]);
  return <CustomerBalanceConfigContext value={value}>{children}</CustomerBalanceConfigContext>;
}

/** Returns the customer-balance configuration from the nearest `CustomerBalanceProvider`. */
export function useCustomerBalanceConfig(): ResolvedCustomerBalanceConfig {
  const ctx = useContext(CustomerBalanceConfigContext);
  if (!ctx) {
    throw new Error('useCustomerBalanceConfig must be used within a CustomerBalanceProvider');
  }
  return ctx;
}

/** Builds a consistent React Query key for customer-balance operations. */
export function buildCustomerBalanceQueryKey(
  config: CustomerBalanceConfig,
  ...segments: readonly (string | number)[]
): readonly unknown[] {
  const prefix = config.queryKeyPrefix ?? ['customer-balance'];
  return [...prefix, ...segments];
}
