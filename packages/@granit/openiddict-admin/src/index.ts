// Types
export type {
  AdminImpersonationResult,
  AdminOidcApplication,
  AdminOidcApplicationCreateRequest,
  AdminOidcApplicationSecretResponse,
  AdminOidcAuthorization,
  AdminOidcAuthorizationListParams,
  AdminOidcScope,
  AdminOidcScopeCreateRequest,
  AdminUser,
  AdminUserListParams,
  AdminUserPage,
} from './types/index.js';

// Query keys
export { openIddictAdminKeys } from './hooks/query-keys.js';

// API — Users (list + impersonate only; CRUD lives in @granit/identity)
export { impersonateUser, listUsers } from './api/admin-user-api.js';

// API — OIDC Applications
export {
  createApplication,
  deleteApplication,
  listApplications,
  rotateApplicationSecret,
} from './api/admin-oidc-application-api.js';

// API — OIDC Scopes
export { createScope, deleteScope, listScopes } from './api/admin-oidc-scope-api.js';

// API — OIDC Authorizations
export {
  listAuthorizations,
  revokeAuthorization,
  revokeUserAuthorizations,
} from './api/admin-oidc-authorization-api.js';
