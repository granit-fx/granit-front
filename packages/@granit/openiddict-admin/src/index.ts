// Types
export type {
  AdminImpersonationResponse,
  AdminOidcApplicationResponse,
  AdminOidcCreateApplicationRequest,
  AdminOidcRotateSecretResponse,
  AdminOidcUpdateApplicationRequest,
  AdminOidcAuthorizationResponse,
  AdminOidcCreateAuthorizationRequest,
  AdminOidcAuthorizationListParams,
  AdminOidcScopeResponse,
  AdminOidcCreateScopeRequest,
  AdminOidcUpdateScopeRequest,
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
  getApplication,
  getApplicationInfo,
  listApplications,
  rotateApplicationSecret,
  updateApplication,
} from './api/admin-oidc-application-api';

// API — OIDC Scopes
export { createScope, deleteScope, listScopes, updateScope } from './api/admin-oidc-scope-api';

// API — OIDC Authorizations
export {
  createAuthorization,
  listAuthorizations,
  revokeAuthorization,
  revokeUserAuthorizations,
} from './api/admin-oidc-authorization-api';
export { OpenIddictPermissions } from './permissions';

// Validation constraints (generated from contracts/openapi/openiddict.json)
export { openiddictConstraints } from './constraints';
