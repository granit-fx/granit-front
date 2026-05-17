/** Permission constants for the localization module. Mirrors `Granit.Localization.Endpoints.Permissions.LocalizationOverridesPermissions`. */
export const LocalizationOverridesPermissions = {
  /** Permissions for the translation overrides resource. */
  Overrides: {
    /** Grants read-only access to view translation overrides. */
    Read: 'Localization.Overrides.Read',
    /** Grants management access to localization override endpoints (set override, remove override). */
    Manage: 'Localization.Overrides.Manage',
  },
} as const;
