// Types
export type { CurrentTenant, MultiTenancyOptions, TenantInfo } from './types/index.js';
export type {
  AdminTenant,
  CreateTenantRequest,
  UpdateTenantRequest,
} from './types/admin-tenant.js';

// Constants
export { DEFAULT_MULTI_TENANCY_OPTIONS } from './types/index.js';

// Permissions
export { MultiTenancyPermissions } from './permissions.js';

// Resolvers
export type { TenantResolver } from './resolvers/tenant-resolver.js';
export { resolveTenant } from './resolvers/tenant-resolver.js';
export type { JwtClaimTenantResolverOptions } from './resolvers/jwt-claim-tenant-resolver.js';
export { createJwtClaimTenantResolver } from './resolvers/jwt-claim-tenant-resolver.js';

// API — Tenant admin
export {
  activateTenant,
  createTenant,
  deactivateTenant,
  getTenant,
  listTenants,
  updateTenant,
} from './api/tenant-admin-api.js';
