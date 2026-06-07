export {
  AuthorizationProvider,
  useAuthorizationConfig,
  useOptionalAuthorizationConfig,
} from './providers/authorization-provider';
export type {
  AuthorizationConfig,
  AuthorizationProviderProps,
  ResolvedAuthorizationConfig,
} from './providers/authorization-provider';
export { usePermissions } from './hooks/use-permissions';
export { buildPermissionQueryKey } from './hooks/query-keys';
export { usePermissionDefinitions } from './hooks/use-permission-definitions';
export { useRolePermissions } from './hooks/use-role-permissions';
export { usePermissionGrant } from './hooks/use-permission-grant';
export { usePermissionGrants, usePermissionGrantMeta } from './hooks/use-permission-grants';
export { useRoleMetadata, useRoleMetadataMeta } from './hooks/use-role-metadata';
export type { UsePermissionGrantReturn } from './hooks/use-permission-grant';
export type {
  UsePermissionDefinitionsOptions,
  UsePermissionGrantOptions,
  UsePermissionGrantsOptions,
  UsePermissionsOptions,
  UsePermissionsReturn,
  UseRoleMetadataOptions,
  UseRolePermissionsOptions,
} from './types';
