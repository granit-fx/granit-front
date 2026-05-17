/** Permission constants for the authentication-api-keys module. Mirrors `Granit.Authentication.ApiKeys.Endpoints.Permissions.ApiKeyPermissions`. */
export const ApiKeyPermissions = {
  /** Permissions for API key administration. */
  Keys: {
    /** Permission to list and view API keys. */
    Read: 'AuthenticationApiKeys.Keys.Read',
    /** Permission to create new API keys. */
    Create: 'AuthenticationApiKeys.Keys.Create',
    /** Permission to revoke API keys. */
    Revoke: 'AuthenticationApiKeys.Keys.Revoke',
    /** Permission to rotate API keys. */
    Rotate: 'AuthenticationApiKeys.Keys.Rotate',
    /** Permission to update permissions and CIDR scopes. */
    UpdateScopes: 'AuthenticationApiKeys.Keys.UpdateScopes',
  },
} as const;
