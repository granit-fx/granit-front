/** Permission constants for the authentication-local module. Mirrors `Granit.Identity.Local.Endpoints.Permissions.IdentityLocalPermissions`. */
export const IdentityLocalPermissions = {
  /** Permissions for user impersonation. */
  Users: {
    /** Permission to impersonate a user by issuing a short-lived token. */
    Impersonate: 'IdentityLocal.Users.Impersonate',
  },
  /** Permissions for the local role CRUD endpoints. */
  Roles: {
    /** Read / list local roles visible in the caller's context. */
    Read: 'IdentityLocal.Roles.Read',
    /** Create or rename local roles. */
    Manage: 'IdentityLocal.Roles.Manage',
    /** Hard-delete non-system roles. */
    Delete: 'IdentityLocal.Roles.Delete',
  },
} as const;
