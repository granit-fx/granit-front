import { useOptionalGranitClient } from '@granit/react-api-client';
import { createContext, useContext, useMemo } from 'react';

import { DEFAULT_BASE_PATH } from '../constants';

import type { AxiosInstance } from '@granit/api-client';
import type { ReactNode } from 'react';

/** Configuration for the tax provider. */
export interface TaxConfig {
  readonly client?: AxiosInstance;
  /** Base path for tax endpoints (default: `/api/v1/tax`). */
  readonly basePath?: string;
  readonly queryKeyPrefix?: readonly string[];
}

/**
 * TaxConfig after the provider has resolved `client` from
 * `config.client` or the nearest `<GranitClientProvider>`.
 */
export interface ResolvedTaxConfig extends TaxConfig {
  readonly client: AxiosInstance;
}

export interface TaxProviderProps {
  readonly config: TaxConfig;
  readonly children: ReactNode;
}

const TaxConfigContext = createContext<ResolvedTaxConfig | null>(null);

/** Provides tax configuration to child components and hooks. */
export function TaxProvider({ config, children }: Readonly<TaxProviderProps>) {
  const contextClient = useOptionalGranitClient();
  const value = useMemo<ResolvedTaxConfig>(() => {
    const client = config.client ?? contextClient;
    if (!client) {
      throw new Error(
        'TaxProvider requires an Axios client. Provide it via config.client or wrap your app in a <GranitClientProvider>.'
      );
    }
    return {
      ...config,
      basePath: config.basePath ?? DEFAULT_BASE_PATH,
      client,
    };
  }, [config, contextClient]);
  return <TaxConfigContext value={value}>{children}</TaxConfigContext>;
}

/** Returns the tax configuration from the nearest `TaxProvider`. */
export function useTaxConfig(): ResolvedTaxConfig {
  const ctx = useContext(TaxConfigContext);
  if (!ctx) {
    throw new Error('useTaxConfig must be used within a TaxProvider');
  }
  return ctx;
}

/** Builds a consistent React Query key for tax operations. */
export function buildTaxQueryKey(
  config: TaxConfig,
  ...segments: readonly string[]
): readonly unknown[] {
  const prefix = config.queryKeyPrefix ?? ['tax'];
  return [...prefix, ...segments];
}
