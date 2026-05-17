/** Permission constants for the identity module. Mirrors `Granit.Identity.Endpoints.Permissions.IdentityPermissions`. */
export const IdentityPermissions = {
  /** Permissions for user management (cache and identity provider). */
  Users: {
    /** Grants access to list, search, and view users (cache and provider). */
    Read: 'Identity.Users.Read',
    /** Grants access to create, update, and enable/disable users in the identity provider. */
    Manage: 'Identity.Users.Manage',
    /** Grants access to force sync (single or full) from the identity provider. */
    Sync: 'Identity.Users.Sync',
    /** Grants access to GDPR erasure and pseudonymization. */
    Delete: 'Identity.Users.Delete',
  },
  /** Permissions for managing roles via the identity provider. */
  Roles: {
    /** Grants access to list roles, view user roles, and list role members. */
    Read: 'Identity.Roles.Read',
    /** Grants access to assign and remove roles. */
    Manage: 'Identity.Roles.Manage',
  },
  /** Permissions for managing groups via the identity provider. */
  Groups: {
    /** Grants access to list groups and view user group memberships. */
    Read: 'Identity.Groups.Read',
    /** Grants access to add and remove users from groups. */
    Manage: 'Identity.Groups.Manage',
  },
  /** Permissions for managing user sessions. */
  Sessions: {
    /** Grants access to view user sessions and device activity. */
    Read: 'Identity.Sessions.Read',
    /** Grants access to terminate user sessions. */
    Manage: 'Identity.Sessions.Manage',
  },
  /** Permissions for managing user passwords. */
  Passwords: {
    /** Grants access to password operations (reset email, temporary password, change history). */
    Manage: 'Identity.Passwords.Manage',
  },
} as const;
