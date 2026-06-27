import { createConfigProvider } from '@granit/react-api-client';

import { DEFAULT_BASE_PATH } from '../constants';

import type {
  GranitProviderConfig,
  GranitProviderProps,
  ResolvedGranitProviderConfig,
} from '@granit/react-api-client';

/** Configuration for the blob-storage provider. */
export interface BlobStorageConfig extends GranitProviderConfig {
  readonly queryKeyPrefix?: readonly string[];
}

/** Resolved configuration where all optional fields have defaults applied. */
export type ResolvedBlobStorageConfig = ResolvedGranitProviderConfig<BlobStorageConfig>;

export type BlobStorageProviderProps = GranitProviderProps<BlobStorageConfig>;

const { Provider, useConfig } = createConfigProvider<BlobStorageConfig>({
  name: 'BlobStorage',
  defaultBasePath: DEFAULT_BASE_PATH,
});

/** Provides blob-storage configuration to child components and hooks. */
export const BlobStorageProvider = Provider;

/** Returns the blob-storage configuration from the nearest `BlobStorageProvider`. */
export const useBlobStorageConfig = useConfig;
