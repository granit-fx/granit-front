import { useOptionalGranitClient } from '@granit/react-api-client';
import { createContext, useContext, useMemo } from 'react';

import { DEFAULT_BASE_PATH, DEFAULT_QUERY_KEY_PREFIX } from '../constants.js';

import type { AxiosInstance } from '@granit/api-client';
import type { ReactNode } from 'react';

/** Configuration for the documents provider. */
export interface DocumentsConfig {
  readonly client?: AxiosInstance;
  /** Base path for documents endpoints (default: `/api/v1/documents`). */
  readonly basePath?: string;
  readonly queryKeyPrefix?: readonly string[];
}

/**
 * DocumentsConfig after the provider has resolved `client` from
 * `config.client` or the nearest `<GranitClientProvider>`.
 */
export interface ResolvedDocumentsConfig extends DocumentsConfig {
  readonly client: AxiosInstance;
  readonly basePath: string;
  readonly queryKeyPrefix: readonly string[];
}

export interface DocumentsProviderProps {
  readonly config: DocumentsConfig;
  readonly children: ReactNode;
}

const DocumentsConfigContext = createContext<ResolvedDocumentsConfig | null>(null);

/** Provides documents configuration to child components and hooks. */
export function DocumentsProvider({ config, children }: Readonly<DocumentsProviderProps>) {
  const contextClient = useOptionalGranitClient();
  const value = useMemo<ResolvedDocumentsConfig>(() => {
    const client = config.client ?? contextClient;
    if (!client) {
      throw new Error(
        'DocumentsProvider requires an Axios client. Provide it via config.client or wrap your app in a <GranitClientProvider>.'
      );
    }
    return {
      ...config,
      client,
      basePath: config.basePath ?? DEFAULT_BASE_PATH,
      queryKeyPrefix: config.queryKeyPrefix ?? [...DEFAULT_QUERY_KEY_PREFIX],
    };
  }, [config, contextClient]);
  return <DocumentsConfigContext value={value}>{children}</DocumentsConfigContext>;
}

/** Returns the documents configuration from the nearest `DocumentsProvider`. */
export function useDocumentsConfig(): ResolvedDocumentsConfig {
  const ctx = useContext(DocumentsConfigContext);
  if (!ctx) {
    throw new Error('useDocumentsConfig must be used within a DocumentsProvider');
  }
  return ctx;
}

/** Builds a consistent React Query key for documents operations. */
export function buildDocumentsQueryKey(
  config: ResolvedDocumentsConfig,
  ...segments: readonly unknown[]
): readonly unknown[] {
  return [...config.queryKeyPrefix, ...segments];
}
