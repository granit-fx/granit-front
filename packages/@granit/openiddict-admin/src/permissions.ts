/** Permission constants for the openiddict-admin module. Mirrors `Granit.OpenIddict.Permissions.OpenIddictPermissions`. */
export const OpenIddictPermissions = {
  /** Permissions for OIDC application administration. */
  Applications: {
    /** Permission to list and view OIDC applications. */
    Read: 'OpenIddict.Applications.Read',
    /** Permission to manage OIDC application details. */
    Manage: 'OpenIddict.Applications.Manage',
    /** Permission to rotate OIDC application secrets. */
    Rotate: 'OpenIddict.Applications.Rotate',
  },
  /** Permissions for OIDC scope administration. */
  Scopes: {
    /** Permission to list and view OIDC scopes. */
    Read: 'OpenIddict.Scopes.Read',
    /** Permission to manage OIDC scope details. */
    Manage: 'OpenIddict.Scopes.Manage',
  },
  /** Permissions for OIDC authorization administration. */
  Authorizations: {
    /** Permission to list and view OIDC authorizations. */
    Read: 'OpenIddict.Authorizations.Read',
    /** Permission to create OIDC authorizations (admin consent grant). */
    Create: 'OpenIddict.Authorizations.Create',
    /** Permission to revoke OIDC authorizations. */
    Revoke: 'OpenIddict.Authorizations.Revoke',
  },
} as const;
