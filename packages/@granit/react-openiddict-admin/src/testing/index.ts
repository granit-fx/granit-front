// ---------------------------------------------------------------------------
// @granit/react-openiddict-admin/testing — Mock data & MSW handlers
// ---------------------------------------------------------------------------

export {
  mockAdminUsers,
  mockOidcApplications,
  mockOidcAuthorizations,
  mockOidcScopes,
} from './data';
export {
  adminUserQueryMetadata,
  createOpenIddictAdminHandlers,
  oidcApplicationQueryMetadata,
  oidcAuthorizationQueryMetadata,
  oidcScopeQueryMetadata,
} from './handlers';
