/** Permission constants for the authorization module. Mirrors `Granit.Authorization.Endpoints.Permissions.AuthorizationEndpointsPermissions`. */
export const AuthorizationEndpointsPermissions = {
  /** Permissions for reading permission definitions. */
  Definitions: {
    /** View all registered permission definitions and groups. */
    Read: 'Authorization.Definitions.Read',
  },
  /** Permissions for managing role → permission grants. */
  Grants: {
    /** View, grant, and revoke permissions for roles. */
    Manage: 'Authorization.Grants.Manage',
  },
} as const;
