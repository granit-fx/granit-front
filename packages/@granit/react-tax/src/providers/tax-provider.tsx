import { createContext, useContext, useMemo } from 'react';

import type { AxiosInstance } from 'axios';
import type { ReactNode } from 'react';

/** Configuration for the tax provider. */
export interface TaxConfig {
  readonly client: AxiosInstance;
  /** Base path for tax endpoints (default: `/api/granit/tax`). */
  readonly basePath?: string;
  readonly queryKeyPrefix?: readonly string[];
}

export interface TaxProviderProps {
  readonly config: TaxConfig;
  readonly children: ReactNode;
}

const TaxConfigContext = createContext<TaxConfig | null>(null);

/** Provides tax configuration to child components and hooks. */
export function TaxProvider({ config, children }: Readonly<TaxProviderProps>) {
  const value = useMemo(() => config, [config]);
  return <TaxConfigContext value={value}>{children}</TaxConfigContext>;
}

/** Returns the tax configuration from the nearest `TaxProvider`. */
export function useTaxConfig(): TaxConfig {
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
