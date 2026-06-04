import { buildQueryKey } from '@granit/query-engine';

/** Query key factory for blob storage queries. */
export const blobStorageKeys = {
  all: ['blob-storage'] as const,
  blobs: () => [...blobStorageKeys.all, 'blob'] as const,
  blob: (id: string, containerName: string) =>
    [...blobStorageKeys.blobs(), id, containerName] as const,
};

/**
 * Query key of the blob **list** (`GET {basePath}/blobs`), as built by the
 * query-engine (`@granit/react-query-engine`'s `useQueryEndpoint`). Mutation
 * hooks invalidate this so the admin list refreshes — it does NOT overlap with
 * {@link blobStorageKeys}, which only covers single-descriptor `useBlob` reads.
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
