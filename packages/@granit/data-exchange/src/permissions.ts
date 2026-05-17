/** Permission constants for the data-exchange module. Mirrors `Granit.DataExchange.Endpoints.Permissions.DataExchangePermissions`. */
export const DataExchangePermissions = {
  /** Permissions for the data import resource. */
  Imports: {
    /** Grants read-only access to view import job history and status. */
    Read: 'DataExchange.Imports.Read',
    /** Grants access to execute data imports (upload, preview, mappings, execute, dry-run, status, report, correction file). */
    Execute: 'DataExchange.Imports.Execute',
  },
  /** Permissions for the data export resource. */
  Exports: {
    /** Grants read-only access to view export definitions and job history. */
    Read: 'DataExchange.Exports.Read',
    /** Grants access to execute data exports (definitions, field listing, export execution, download, presets). */
    Execute: 'DataExchange.Exports.Execute',
  },
} as const;
