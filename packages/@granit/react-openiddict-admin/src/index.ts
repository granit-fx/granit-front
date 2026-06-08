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
  useOidcApplication,
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
  useCreateOidcAuthorization,
  useOidcAuthorizations,
  useRevokeAuthorization,
  useRevokeUserAuthorizations,
} from './hooks/use-oidc-authorizations';

// Hooks — Auth flows
export { useConsentApplication } from './hooks/use-consent-application';
export type { ConsentApplicationInfo } from './hooks/use-consent-application';
export { useConsentFlow } from './hooks/use-consent-flow';
export type { ConsentFlowState } from './hooks/use-consent-flow';
export { useDeviceVerification } from './hooks/use-device-verification';
export type {
  DeviceVerificationState,
  DeviceVerificationStatus,
} from './hooks/use-device-verification';

// Query keys
export { openIddictAdminKeys } from './hooks/query-keys';
