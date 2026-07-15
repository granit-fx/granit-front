/** Permission constants for the data-exchange module. Mirrors `Granit.DataExchange.Endpoints.Permissions.DataExchangePermissions`. */
export const DataExchangePermissions = {
  /**
   * Permissions for the data import resource.
   *
   * The backend model is flat: `Execute` does NOT imply `Read`. Read endpoints
   * require `Read`, mutating endpoints require `Execute` — grant both to roles
   * that need the full import lifecycle.
   */
  Imports: {
    /** Grants read access to import reads: job listing, status (`GET /{jobId}`), execution report, and correction file. */
    Read: 'DataExchange.Imports.Read',
    /** Grants access to import mutations: upload, preview, confirm mappings, execute, dry-run, and cancel. */
    Execute: 'DataExchange.Imports.Execute',
  },
  /**
   * Permissions for the data export resource.
   *
   * The backend model is flat: `Execute` does NOT imply `Read`. Read endpoints
   * require `Read`, mutating endpoints require `Execute` — grant both to roles
   * that need the full export lifecycle.
   */
  Exports: {
    /** Grants read access to export reads: definitions, field listing, job listing, job status, download, and preset listing. */
    Read: 'DataExchange.Exports.Read',
    /** Grants access to export mutations: create export job, save preset, and delete preset. */
    Execute: 'DataExchange.Exports.Execute',
  },
} as const;
