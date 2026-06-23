// Types
export type { CurrentTenant, MultiTenancyOptions, TenantInfo } from './types/index';
export type {
  TenantResponse,
  CreateTenantRequest,
  UpdateTenantRequest,
} from './types/tenant-response';

// Constants
export { DEFAULT_MULTI_TENANCY_OPTIONS } from './types/index';

// Validation constraints (generated from contracts/openapi/multi-tenancy.json)
export { multiTenancyConstraints } from './constraints';

// Permissions
export { MultiTenancyPermissions } from './permissions';

// Resolvers
export type { TenantResolver } from './resolvers/tenant-resolver';
export { resolveTenant } from './resolvers/tenant-resolver';
export type { JwtClaimTenantResolverOptions } from './resolvers/jwt-claim-tenant-resolver';
export { createJwtClaimTenantResolver } from './resolvers/jwt-claim-tenant-resolver';

// API — Tenant admin
// Note: there is no `listTenants` — the backend deliberately does not expose a
// plain list endpoint. Tenant listing is served by a Granit.QueryEngine endpoint
// registered by the consumer at `{basePath}/tenants` (returns PagedResult),
// consumed generically via @granit/react-query-engine.
export {
  activateTenant,
  createTenant,
  deactivateTenant,
  getTenant,
  updateTenant,
} from './api/tenant-admin-api';
