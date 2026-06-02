/** Permission constants for the hostnames module. Mirrors `Granit.Hostnames.Endpoints.Permissions.HostnamesPermissions`. */
export const HostnamesPermissions = {
  Hostnames: {
    /** Grants read-only access to managed hostnames (list, detail, check-availability). */
    Read: 'Hostnames.Hostnames.Read',
    /** Grants full management access to hostnames (create, update, delete, verify-now). */
    Manage: 'Hostnames.Hostnames.Manage',
  },
  Certificates: {
    /** Grants access to report certificate status updates (host-level webhook receiver). */
    Report: 'Hostnames.Certificates.Report',
  },
} as const;
