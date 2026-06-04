export type {
  PermissionDefinitionDto,
  PermissionGrantDto,
  PermissionGrantParams,
  PermissionGroupDto,
  PermissionMultiTenancySide,
  PermissionsResponse,
} from './types/index';
export { AuthorizationEndpointsPermissions } from './permissions';
export {
  getMyPermissions,
  getRolePermissions,
  grantPermission,
  listPermissionDefinitions,
  revokePermission,
} from './api/permissions-api';
