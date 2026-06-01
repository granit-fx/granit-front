// Provider — Runtime tenant resolution
export { TenantProvider, useTenant } from './providers/tenant-provider';
export type { TenantProviderProps } from './providers/tenant-provider';

// Provider — Tenant admin
export {
  TenantAdminProvider,
  buildTenantAdminQueryKey,
  useTenantAdminConfig,
} from './providers/tenant-admin-provider';
export type {
  TenantAdminConfig,
  TenantAdminProviderProps,
} from './providers/tenant-admin-provider';

// Hooks — Runtime
export { useKeycloakTenantResolvers } from './hooks/use-keycloak-tenant-resolvers';
export type { UseKeycloakTenantResolversOptions } from './hooks/use-keycloak-tenant-resolvers';
export { useClearQueriesOnTenantChange } from './hooks/use-clear-queries-on-tenant-change';
export { useClearQueriesOnUserChange } from './hooks/use-clear-queries-on-user-change';

// Hooks — Tenant admin
export {
  useActivateTenant,
  useCreateTenant,
  useDeactivateTenant,
  useTenantDetail,
  useTenants,
  useUpdateTenant,
} from './hooks/use-tenant-admin';
