// Types
export type {
  AdminImpersonationResult,
  AdminOidcApplication,
  AdminOidcApplicationCreateRequest,
  AdminOidcApplicationSecretResponse,
  AdminOidcApplicationUpdateRequest,
  AdminOidcAuthorization,
  AdminOidcAuthorizationListParams,
  AdminOidcScope,
  AdminOidcScopeCreateRequest,
  AdminOidcScopeUpdateRequest,
  AdminUser,
  AdminUserListParams,
  AdminUserPage,
} from './types/index';

// Query keys

// API — Users (list + impersonate only; CRUD lives in @granit/identity)
export { impersonateUser, listUsers } from './api/admin-user-api';

// API — OIDC Applications
export {
  createApplication,
  deleteApplication,
  listApplications,
  rotateApplicationSecret,
  updateApplication,
} from './api/admin-oidc-application-api';

// API — OIDC Scopes
export { createScope, deleteScope, listScopes, updateScope } from './api/admin-oidc-scope-api';

// API — OIDC Authorizations
export {
  listAuthorizations,
  revokeAuthorization,
  revokeUserAuthorizations,
} from './api/admin-oidc-authorization-api';
export { OpenIddictPermissions } from './permissions';
