import { createContext, useContext, useMemo } from 'react';

import type { AxiosInstance } from 'axios';
import type { ReactNode } from 'react';

/** Configuration for the invoicing provider. */
export interface InvoicingConfig {
  readonly client: AxiosInstance;
  /** Base path for invoicing endpoints (default: `/api/v1/invoicing`). */
  readonly basePath?: string;
  readonly queryKeyPrefix?: readonly string[];
}

export interface InvoicingProviderProps {
  readonly config: InvoicingConfig;
  readonly children: ReactNode;
}

const InvoicingConfigContext = createContext<InvoicingConfig | null>(null);

/** Provides invoicing configuration to child components and hooks. */
export function InvoicingProvider({ config, children }: Readonly<InvoicingProviderProps>) {
  const value = useMemo(() => config, [config]);
  return <InvoicingConfigContext value={value}>{children}</InvoicingConfigContext>;
}

/** Returns the invoicing configuration from the nearest `InvoicingProvider`. */
export function useInvoicingConfig(): InvoicingConfig {
  const ctx = useContext(InvoicingConfigContext);
  if (!ctx) {
    throw new Error('useInvoicingConfig must be used within an InvoicingProvider');
  }
  return ctx;
}

/** Builds a consistent React Query key for invoicing operations. */
export function buildInvoicingQueryKey(
  config: InvoicingConfig,
  ...segments: readonly string[]
): readonly unknown[] {
  const prefix = config.queryKeyPrefix ?? ['invoicing'];
  return [...prefix, ...segments];
}
