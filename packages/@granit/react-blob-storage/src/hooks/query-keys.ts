import { buildQueryKey } from '@granit/query-engine';

import type { BlobStorageConfig } from '../providers/blob-storage-provider';

export const DEFAULT_BLOB_STORAGE_KEY_PREFIX = ['blob-storage'] as const;

/**
 * Builds a consistent React Query key for single-descriptor blob operations
 * (`useBlob` reads and their invalidation).
 *
 * Does NOT overlap with {@link blobListQueryKey}, which covers the query-engine
 * blob **list** (`GET {basePath}/blobs`).
 *
 * @param config - Provider config carrying an optional `queryKeyPrefix`.
 * @param segments - Additional segments appended after the prefix.
 */
export function buildBlobStorageQueryKey(
  config: Pick<BlobStorageConfig, 'queryKeyPrefix'>,
  ...segments: readonly unknown[]
): readonly unknown[] {
  return [...(config.queryKeyPrefix ?? DEFAULT_BLOB_STORAGE_KEY_PREFIX), ...segments];
}

/**
 * Query key of the blob **list** (`GET {basePath}/blobs`), as built by the
 * query-engine (`@granit/react-query-engine`'s `useQueryEndpoint`). Mutation
 * hooks invalidate this so the admin list refreshes — it does NOT overlap with
 * {@link buildBlobStorageQueryKey}, which only covers single-descriptor
 * `useBlob` reads.
 *
 * The key mirrors `buildQueryKey({ basePath: \`${basePath}/blobs\` }, 'list')`,
 * matching a `QueryProvider`/`useQueryEndpoint` configured at `{basePath}/blobs`.
 */
export function blobListQueryKey(config: {
  readonly basePath: string;
  readonly queryKeyPrefix?: readonly string[];
}): readonly unknown[] {
  return buildQueryKey(
    { basePath: `${config.basePath}/blobs`, queryKeyPrefix: config.queryKeyPrefix },
    'list'
  );
}
