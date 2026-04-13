import { createContext, useContext, useMemo } from 'react';

import type { AxiosInstance } from 'axios';
import type { ReactNode } from 'react';

/** Configuration for the customer-balance provider. */
export interface CustomerBalanceConfig {
  readonly client: AxiosInstance;
  /** Base path for customer-balance endpoints (default: `/api/v1/customer-balance`). */
  readonly basePath?: string;
  readonly queryKeyPrefix?: readonly string[];
}

export interface CustomerBalanceProviderProps {
  readonly config: CustomerBalanceConfig;
  readonly children: ReactNode;
}

const CustomerBalanceConfigContext = createContext<CustomerBalanceConfig | null>(null);

/** Provides customer-balance configuration to child components and hooks. */
export function CustomerBalanceProvider({
  config,
  children,
}: Readonly<CustomerBalanceProviderProps>) {
  const value = useMemo(() => config, [config]);
  return <CustomerBalanceConfigContext value={value}>{children}</CustomerBalanceConfigContext>;
}

/** Returns the customer-balance configuration from the nearest `CustomerBalanceProvider`. */
export function useCustomerBalanceConfig(): CustomerBalanceConfig {
  const ctx = useContext(CustomerBalanceConfigContext);
  if (!ctx) {
    throw new Error('useCustomerBalanceConfig must be used within a CustomerBalanceProvider');
  }
  return ctx;
}

/** Builds a consistent React Query key for customer-balance operations. */
export function buildCustomerBalanceQueryKey(
  config: CustomerBalanceConfig,
  ...segments: readonly string[]
): readonly unknown[] {
  const prefix = config.queryKeyPrefix ?? ['customer-balance'];
  return [...prefix, ...segments];
}
