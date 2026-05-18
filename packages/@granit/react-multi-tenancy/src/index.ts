// Provider — Runtime tenant resolution
export { TenantProvider, useTenant } from './providers/tenant-provider.js';
export type { TenantProviderProps } from './providers/tenant-provider.js';

// Provider — Tenant admin
export {
  TenantAdminProvider,
  buildTenantAdminQueryKey,
  useTenantAdminConfig,
} from './providers/tenant-admin-provider.js';
export type {
  TenantAdminConfig,
  TenantAdminProviderProps,
} from './providers/tenant-admin-provider.js';

// Hooks — Runtime
export { useKeycloakTenantResolvers } from './hooks/use-keycloak-tenant-resolvers.js';
export type { UseKeycloakTenantResolversOptions } from './hooks/use-keycloak-tenant-resolvers.js';
export { useClearQueriesOnTenantChange } from './hooks/use-clear-queries-on-tenant-change.js';
export { useClearQueriesOnUserChange } from './hooks/use-clear-queries-on-user-change.js';

// Hooks — Tenant admin
export {
  useActivateTenant,
  useCreateTenant,
  useDeactivateTenant,
  useTenantDetail,
  useTenants,
  useUpdateTenant,
} from './hooks/use-tenant-admin.js';
