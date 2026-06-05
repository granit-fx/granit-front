'use client';

import { DEFAULT_LOOKUP_BASE_PATH } from '@granit/data-lookup';
import { useOptionalGranitClient } from '@granit/react-api-client';
import { createContext, useContext, useMemo } from 'react';

import type { AxiosInstance } from '@granit/api-client';
import type { ReactNode } from 'react';

/**
 * Ambient configuration for the data-lookup hooks and components. Lets consumers
 * provide the Axios client, base path, and UI culture once instead of threading
 * them through every {@link useLookup}/{@link LookupSelect} call site.
 */
export interface DataLookupConfig {
  /** Axios instance used for HTTP requests. Falls back to the ambient `<GranitClientProvider>`. */
  readonly client?: AxiosInstance;
  /** Override the registry base path. Default: {@link DEFAULT_LOOKUP_BASE_PATH}. */
  readonly basePath?: string;
  /** Current UI culture (e.g. `"fr-CA"`) forwarded to the per-language cache key. */
  readonly culture?: string;
}

/** Resolved configuration where `client` and `basePath` are guaranteed. */
export interface ResolvedDataLookupConfig extends DataLookupConfig {
  readonly client: AxiosInstance;
  readonly basePath: string;
}

export interface DataLookupProviderProps {
  readonly config?: DataLookupConfig;
  readonly children: ReactNode;
}

const DataLookupConfigContext = createContext<ResolvedDataLookupConfig | null>(null);

/**
 * Provides data-lookup configuration to descendant hooks and components. The
 * Axios client is taken from `config.client` when supplied, otherwise from the
 * nearest `<GranitClientProvider>`.
 */
export function DataLookupProvider({ config, children }: Readonly<DataLookupProviderProps>) {
  const contextClient = useOptionalGranitClient();
  const value = useMemo<ResolvedDataLookupConfig>(() => {
    const client = config?.client ?? contextClient;
    if (!client) {
      throw new Error(
        'DataLookupProvider requires an Axios client. Provide it via config.client or wrap your app in a <GranitClientProvider>.'
      );
    }
    return { ...config, client, basePath: config?.basePath ?? DEFAULT_LOOKUP_BASE_PATH };
  }, [config, contextClient]);

  return <DataLookupConfigContext value={value}>{children}</DataLookupConfigContext>;
}

/** Returns the data-lookup configuration from the nearest {@link DataLookupProvider}. */
export function useDataLookupConfig(): ResolvedDataLookupConfig {
  const ctx = useContext(DataLookupConfigContext);
  if (!ctx) {
    throw new Error('useDataLookupConfig must be used within a <DataLookupProvider>');
  }
  return ctx;
}

/**
 * Returns the data-lookup configuration if a {@link DataLookupProvider} is
 * present, otherwise `null`. Used by hooks/components that accept an explicit
 * `client` prop and only fall back to the provider when it is omitted.
 */
export function useOptionalDataLookupConfig(): ResolvedDataLookupConfig | null {
  return useContext(DataLookupConfigContext);
}
