// Provider
export {
  OpenIddictAdminProvider,
  buildAdminQueryKey,
  useAdminConfig,
} from './providers/openiddict-admin-provider.js';
export type {
  OpenIddictAdminConfig,
  OpenIddictAdminProviderProps,
} from './providers/openiddict-admin-provider.js';

// Hooks — Users (list + impersonate only; CRUD lives in @granit/react-identity)
export { useAdminUsers, useImpersonateUser } from './hooks/use-admin-users.js';

// Hooks — OIDC Applications
export {
  useCreateOidcApplication,
  useDeleteOidcApplication,
  useOidcApplications,
  useRotateApplicationSecret,
} from './hooks/use-oidc-applications.js';

// Hooks — OIDC Scopes
export { useCreateOidcScope, useDeleteOidcScope, useOidcScopes } from './hooks/use-oidc-scopes.js';

// Hooks — OIDC Authorizations
export {
  useOidcAuthorizations,
  useRevokeAuthorization,
  useRevokeUserAuthorizations,
} from './hooks/use-oidc-authorizations.js';
