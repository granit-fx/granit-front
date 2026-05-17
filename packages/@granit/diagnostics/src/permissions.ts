/** Permission constants for the diagnostics module. Mirrors `Granit.Diagnostics.Endpoints.Permissions.DiagnosticsPermissions`. */
export const DiagnosticsPermissions = {
  /** Monitoring dashboard permissions. */
  Monitoring: {
    /** View the aggregated health status of all registered services. */
    Read: 'Diagnostics.Monitoring.Read',
  },
} as const;
