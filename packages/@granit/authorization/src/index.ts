export type {
  PermissionDefinitionResponse,
  PermissionGrantResponse,
  PermissionGrantParams,
  PermissionGroupResponse,
  PermissionMultiTenancySide,
  MyPermissionsResponse,
} from './types/index';
export { AuthorizationEndpointsPermissions } from './permissions';
export {
  getMyPermissions,
  getRolePermissions,
  grantPermission,
  listPermissionDefinitions,
  revokePermission,
} from './api/permissions-api';
