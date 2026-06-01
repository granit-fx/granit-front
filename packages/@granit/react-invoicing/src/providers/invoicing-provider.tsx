import { useOptionalGranitClient } from '@granit/react-api-client';
import { createContext, useContext, useMemo } from 'react';

import { DEFAULT_BASE_PATH } from '../constants';

import type { AxiosInstance } from '@granit/api-client';
import type { ReactNode } from 'react';

/** Configuration for the invoicing provider. */
export interface InvoicingConfig {
  readonly client?: AxiosInstance;
  /** Base path for invoicing endpoints (default: `/api/v1/invoicing`). */
  readonly basePath?: string;
  readonly queryKeyPrefix?: readonly string[];
}

/**
 * InvoicingConfig after the provider has resolved `client` from
 * `config.client` or the nearest `<GranitClientProvider>`.
 */
export interface ResolvedInvoicingConfig extends InvoicingConfig {
  readonly client: AxiosInstance;
}

export interface InvoicingProviderProps {
  readonly config: InvoicingConfig;
  readonly children: ReactNode;
}

const InvoicingConfigContext = createContext<ResolvedInvoicingConfig | null>(null);

/** Provides invoicing configuration to child components and hooks. */
export function InvoicingProvider({ config, children }: Readonly<InvoicingProviderProps>) {
  const contextClient = useOptionalGranitClient();
  const value = useMemo<ResolvedInvoicingConfig>(() => {
    const client = config.client ?? contextClient;
    if (!client) {
      throw new Error(
        'InvoicingProvider requires an Axios client. Provide it via config.client or wrap your app in a <GranitClientProvider>.'
      );
    }
    return {
      ...config,
      basePath: config.basePath ?? DEFAULT_BASE_PATH,
      client,
    };
  }, [config, contextClient]);
  return <InvoicingConfigContext value={value}>{children}</InvoicingConfigContext>;
}

/** Returns the invoicing configuration from the nearest `InvoicingProvider`. */
export function useInvoicingConfig(): ResolvedInvoicingConfig {
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
