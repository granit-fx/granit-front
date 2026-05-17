/** Query key factory for blob storage queries. */
export const blobStorageKeys = {
  all: ['blob-storage'] as const,
  blobs: () => [...blobStorageKeys.all, 'blob'] as const,
  blob: (id: string, containerName: string) =>
    [...blobStorageKeys.blobs(), id, containerName] as const,
};
