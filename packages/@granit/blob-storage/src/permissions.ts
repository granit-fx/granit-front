/** Permission constants for the blob-storage module. Mirrors `Granit.BlobStorage.Endpoints.Permissions.BlobStoragePermissions`. */
export const BlobStoragePermissions = {
  /** Permissions for blob storage administration. */
  Administration: {
    /** Grants read-only access to blob storage administration (list, descriptors, query). */
    Read: 'BlobStorage.Administration.Read',
    /** Grants full management access to blob storage administration (upload, download, delete, confirm, cleanup). */
    Manage: 'BlobStorage.Administration.Manage',
  },
} as const;
