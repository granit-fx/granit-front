// Provider
export {
  OpenIddictAdminProvider,
  buildAdminQueryKey,
  useAdminConfig,
} from './providers/openiddict-admin-provider';
export type {
  OpenIddictAdminConfig,
  OpenIddictAdminProviderProps,
} from './providers/openiddict-admin-provider';

// Hooks — Users (list + impersonate only; CRUD lives in @granit/react-identity)
export { useAdminUsers, useImpersonateUser } from './hooks/use-admin-users';

// Hooks — OIDC Applications
export {
  useCreateOidcApplication,
  useDeleteOidcApplication,
  useOidcApplications,
  useRotateApplicationSecret,
  useUpdateOidcApplication,
} from './hooks/use-oidc-applications';

// Hooks — OIDC Scopes
export {
  useCreateOidcScope,
  useDeleteOidcScope,
  useOidcScopes,
  useUpdateOidcScope,
} from './hooks/use-oidc-scopes';

// Hooks — OIDC Authorizations
export {
  useOidcAuthorizations,
  useRevokeAuthorization,
  useRevokeUserAuthorizations,
} from './hooks/use-oidc-authorizations';

// Query keys
export { openIddictAdminKeys } from './hooks/query-keys';
