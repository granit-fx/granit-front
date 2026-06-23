// @granit/react-ui-authorization — i18next resource bundle (flat keys, "translation" ns).
// Register in the host app:
//   import { authorizationTranslationsEn } from "@granit/react-ui-authorization";
//   i18n.addResourceBundle("en", "translation", authorizationTranslationsEn, true, true);

export const authorizationTranslationsEn = {
  'Auth.AccessDenied.ConnectedAs': 'Connected as',
  'Auth.AccessDenied.Title': 'Access Denied',
  'Auth.AccessDeniedContact': 'Please contact your system administrator to request access.',
  'Auth.AccessDeniedMessage': 'You do not have the required permissions to access this page.',
  'Auth.SwitchAccount': 'Switch account',
  'PermissionGrants.Columns.Created': 'Created',
  'PermissionGrants.Columns.Permission': 'Permission',
  'PermissionGrants.Columns.Provider': 'Provider',
  'PermissionGrants.Columns.Role': 'Role',
  'PermissionGrants.Empty': 'No permission grants found',
  'PermissionGrants.Subtitle':
    'Browse every role → permission grant recorded by the authorization store',
  'PermissionGrants.Title': 'Permission grants',
  'Permissions.Roles.GrantSuccess': 'Permission granted',
  'Permissions.Roles.RevokeSuccess': 'Permission revoked',
  'Permissions.Roles.SelectRole': 'Role:',
  'Permissions.Side.Both': 'Both',
  'Permissions.Side.Host': 'Host',
  'Permissions.Side.Tenant': 'Tenant',
  'Permissions.Subtitle': 'Manage permission definitions and role assignments',
  'Permissions.Title': 'Permissions',
  'RoleMetadata.Columns.Created': 'Created',
  'RoleMetadata.Columns.Description': 'Description',
  'RoleMetadata.Columns.Role': 'Role',
  'RoleMetadata.Columns.Scope': 'Scope',
  'RoleMetadata.Columns.System': 'System',
  'RoleMetadata.Empty': 'No roles found',
  'RoleMetadata.Subtitle': 'Inspect role definitions, tenancy scope and lifecycle flags',
  'RoleMetadata.Title': 'Role metadata',
} as const;

export type AuthorizationTranslations = typeof authorizationTranslationsEn;
