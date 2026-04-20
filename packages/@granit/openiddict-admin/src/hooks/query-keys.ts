/** Query key factory for OpenIddict admin queries. */
export const openIddictAdminKeys = {
  all: ['openiddict-admin'] as const,
  users: () => [...openIddictAdminKeys.all, 'users'] as const,
  applications: () => [...openIddictAdminKeys.all, 'oidc', 'applications'] as const,
  scopes: () => [...openIddictAdminKeys.all, 'oidc', 'scopes'] as const,
  authorizations: () => [...openIddictAdminKeys.all, 'oidc', 'authorizations'] as const,
};
