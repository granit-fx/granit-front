import { createContext, useContext, useMemo } from 'react';

import { DEFAULT_BASE_PATH } from '../constants.js';

import type { AxiosInstance } from 'axios';
import type { ReactNode } from 'react';

/** Configuration for the payments provider. */
export interface PaymentsConfig {
  readonly client: AxiosInstance;
  /** Base path for payment endpoints (default: `/api/v1/payments`). */
  readonly basePath?: string;
  readonly queryKeyPrefix?: readonly string[];
}

export interface PaymentsProviderProps {
  readonly config: PaymentsConfig;
  readonly children: ReactNode;
}

const PaymentsConfigContext = createContext<PaymentsConfig | null>(null);

/** Provides payments configuration to child components and hooks. */
export function PaymentsProvider({ config, children }: Readonly<PaymentsProviderProps>) {
  const value = useMemo(() => ({
    ...config,
    basePath: config.basePath ?? DEFAULT_BASE_PATH,
  }), [config]);
  return <PaymentsConfigContext value={value}>{children}</PaymentsConfigContext>;
}

/** Returns the payments configuration from the nearest `PaymentsProvider`. */
export function usePaymentsConfig(): PaymentsConfig {
  const ctx = useContext(PaymentsConfigContext);
  if (!ctx) {
    throw new Error('usePaymentsConfig must be used within a PaymentsProvider');
  }
  return ctx;
}

/** Builds a consistent React Query key for payments operations. */
export function buildPaymentsQueryKey(
  config: PaymentsConfig,
  ...segments: readonly string[]
): readonly unknown[] {
  const prefix = config.queryKeyPrefix ?? ['payments'];
  return [...prefix, ...segments];
}
