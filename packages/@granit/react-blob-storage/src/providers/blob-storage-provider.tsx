import { useOptionalGranitClient } from '@granit/react-api-client';
import { createContext, useContext, useMemo } from 'react';

import { DEFAULT_BASE_PATH } from '../constants';

import type { AxiosInstance } from '@granit/api-client';
import type { ReactNode } from 'react';

/** Configuration for the blob-storage provider. */
export interface BlobStorageConfig {
  readonly client?: AxiosInstance;
  /** Base path for blob-storage endpoints (default: `/api/v1/blob-storage`). */
  readonly basePath?: string;
  readonly queryKeyPrefix?: readonly string[];
}

/** Resolved configuration where all optional fields have defaults applied. */
export interface ResolvedBlobStorageConfig extends BlobStorageConfig {
  readonly client: AxiosInstance;
  readonly basePath: string;
}

export interface BlobStorageProviderProps {
  readonly config: BlobStorageConfig;
  readonly children: ReactNode;
}

const BlobStorageConfigContext = createContext<ResolvedBlobStorageConfig | null>(null);

/** Provides blob-storage configuration to child components and hooks. */
export function BlobStorageProvider({ config, children }: Readonly<BlobStorageProviderProps>) {
  const contextClient = useOptionalGranitClient();
  const value = useMemo<ResolvedBlobStorageConfig>(() => {
    const client = config.client ?? contextClient;
    if (!client) {
      throw new Error(
        'BlobStorageProvider requires an Axios client. Provide it via config.client or wrap your app in a <GranitClientProvider>.'
      );
    }
    return { ...config, client, basePath: config.basePath ?? DEFAULT_BASE_PATH };
  }, [config, contextClient]);
  return <BlobStorageConfigContext value={value}>{children}</BlobStorageConfigContext>;
}

/** Returns the blob-storage configuration from the nearest `BlobStorageProvider`. */
export function useBlobStorageConfig(): ResolvedBlobStorageConfig {
  const ctx = useContext(BlobStorageConfigContext);
  if (!ctx) {
    throw new Error('useBlobStorageConfig must be used within a <BlobStorageProvider>');
  }
  return ctx;
}
