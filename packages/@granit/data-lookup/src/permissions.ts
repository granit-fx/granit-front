/** Permission constants for the data-lookup module. Mirrors `Granit.DataLookup.Endpoints.Permissions.DataLookupPermissions`. */
export const DataLookupPermissions = {
  /** Permissions for the lookup resource. */
  Lookups: {
    /** Grants read access to the manifest and the lookup search endpoints. */
    Read: 'DataLookup.Lookups.Read',
  },
} as const;
