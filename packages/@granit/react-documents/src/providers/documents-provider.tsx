import { createConfigProvider } from '@granit/react-api-client';

import { DEFAULT_BASE_PATH, DEFAULT_QUERY_KEY_PREFIX } from '../constants';

import type { AxiosInstance } from '@granit/api-client';
import type { GranitProviderConfig, GranitProviderProps } from '@granit/react-api-client';

/** Configuration for the documents provider. */
export interface DocumentsConfig extends GranitProviderConfig {
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

export type DocumentsProviderProps = GranitProviderProps<DocumentsConfig>;

const { Provider, useConfig } = createConfigProvider<DocumentsConfig, ResolvedDocumentsConfig>({
  name: 'Documents',
  defaultBasePath: DEFAULT_BASE_PATH,
  resolve: (base) => ({
    ...base,
    queryKeyPrefix: base.queryKeyPrefix ?? [...DEFAULT_QUERY_KEY_PREFIX],
  }),
});

/** Provides documents configuration to child components and hooks. */
export const DocumentsProvider = Provider;

/** Returns the documents configuration from the nearest `DocumentsProvider`. */
export const useDocumentsConfig = useConfig;

/** Builds a consistent React Query key for documents operations. */
export function buildDocumentsQueryKey(
  config: ResolvedDocumentsConfig,
  ...segments: readonly unknown[]
): readonly unknown[] {
  return [...config.queryKeyPrefix, ...segments];
}
