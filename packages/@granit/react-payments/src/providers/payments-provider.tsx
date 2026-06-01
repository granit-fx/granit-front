import { useOptionalGranitClient } from '@granit/react-api-client';
import { createContext, useContext, useMemo } from 'react';

import { DEFAULT_BASE_PATH } from '../constants';

import type { AxiosInstance } from '@granit/api-client';
import type { ReactNode } from 'react';

/** Configuration for the payments provider. */
export interface PaymentsConfig {
  readonly client?: AxiosInstance;
  /** Base path for payment endpoints (default: `/api/v1/payments`). */
  readonly basePath?: string;
  readonly queryKeyPrefix?: readonly string[];
}

/**
 * PaymentsConfig after the provider has resolved `client` from
 * `config.client` or the nearest `<GranitClientProvider>`.
 */
export interface ResolvedPaymentsConfig extends PaymentsConfig {
  readonly client: AxiosInstance;
}

export interface PaymentsProviderProps {
  readonly config: PaymentsConfig;
  readonly children: ReactNode;
}

const PaymentsConfigContext = createContext<ResolvedPaymentsConfig | null>(null);

/** Provides payments configuration to child components and hooks. */
export function PaymentsProvider({ config, children }: Readonly<PaymentsProviderProps>) {
  const contextClient = useOptionalGranitClient();
  const value = useMemo<ResolvedPaymentsConfig>(() => {
    const client = config.client ?? contextClient;
    if (!client) {
      throw new Error(
        'PaymentsProvider requires an Axios client. Provide it via config.client or wrap your app in a <GranitClientProvider>.'
      );
    }
    return {
      ...config,
      basePath: config.basePath ?? DEFAULT_BASE_PATH,
      client,
    };
  }, [config, contextClient]);
  return <PaymentsConfigContext value={value}>{children}</PaymentsConfigContext>;
}

/** Returns the payments configuration from the nearest `PaymentsProvider`. */
export function usePaymentsConfig(): ResolvedPaymentsConfig {
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
