/** Permission constants for the settings module. Mirrors `Granit.Settings.Endpoints.Permissions.SettingsPermissions`. */
export const SettingsPermissions = {
  /** Permissions for the global settings resource. */
  Global: {
    /** Grants read access to global settings. */
    Read: 'Settings.Global.Read',
    /** Grants write access to global settings. */
    Manage: 'Settings.Global.Manage',
  },
  /** Permissions for the tenant settings resource. */
  Tenant: {
    /** Grants read access to tenant settings. */
    Read: 'Settings.Tenant.Read',
    /** Grants write access to tenant settings. */
    Manage: 'Settings.Tenant.Manage',
  },
} as const;
