import type {
  PermissionDefinitionResponse,
  PermissionGrant,
  PermissionGroupResponse,
  RoleMetadata,
} from '@granit/authorization';

/**
 * Builds a {@link PermissionDefinitionResponse}. `multiTenancySides` defaults to
 * `'Both'` (the backend's default for legacy declarations) so every mock
 * permission carries the field the real API always returns.
 */
function def(
  name: string,
  displayName: string,
  multiTenancySides: PermissionDefinitionResponse['multiTenancySides'] = 'Both'
): PermissionDefinitionResponse {
  return { name, displayName, multiTenancySides };
}

export const mockPermissionGroups: PermissionGroupResponse[] = [
  {
    name: 'Showcase',
    displayName: 'Showcase Application',
    permissions: [
      def('Showcase.Users.Read', 'View users'),
      def('Showcase.Users.Manage', 'Create, edit, disable users'),
      def('Showcase.Countries.Read', 'View countries'),
      def('Showcase.Countries.Manage', 'Create, edit, deactivate countries'),
    ],
  },
  {
    name: 'AI',
    displayName: 'AI Management',
    permissions: [
      def('AI.Workspaces.Read', 'View AI workspaces'),
      def('AI.Workspaces.Manage', 'Create, edit, delete AI workspaces'),
      def('AI.Usage.Read', 'View AI usage statistics'),
      def('AI.Chat.Execute', 'Execute AI chat completions'),
      def('AI.Embeddings.Execute', 'Execute AI embeddings'),
    ],
  },
  {
    name: 'AuthenticationApiKeys',
    displayName: 'API Key Management',
    permissions: [
      def('AuthenticationApiKeys.Keys.Read', 'View API keys'),
      def('AuthenticationApiKeys.Keys.Create', 'Create API keys'),
      def('AuthenticationApiKeys.Keys.Revoke', 'Revoke API keys'),
      def('AuthenticationApiKeys.Keys.Rotate', 'Rotate API keys'),
      def('AuthenticationApiKeys.Keys.UpdateScopes', 'Update API key scopes and CIDR'),
    ],
  },
  {
    name: 'Authorization',
    displayName: 'Authorization',
    permissions: [
      def('Authorization.Definitions.Read', 'View permission definitions'),
      def('Authorization.Grants.Manage', 'Manage permission grants'),
    ],
  },
  {
    name: 'BackgroundJobs',
    displayName: 'Background Jobs',
    permissions: [
      def('BackgroundJobs.Jobs.Read', 'View background jobs'),
      def('BackgroundJobs.Jobs.Manage', 'Manage jobs (pause, resume, trigger)'),
    ],
  },
  {
    name: 'Features',
    displayName: 'Feature Flags',
    permissions: [
      def('Features.Flags.Read', 'View feature flags'),
      def('Features.Flags.Manage', 'Manage feature flags'),
    ],
  },
  {
    name: 'Identity',
    displayName: 'Identity',
    permissions: [
      def('Identity.Users.Read', 'View identity users'),
      def('Identity.Users.Manage', 'Manage identity users'),
      def('Identity.Roles.Read', 'View identity roles'),
      def('Identity.Roles.Manage', 'Manage identity roles'),
    ],
  },
  {
    name: 'Settings',
    displayName: 'Application Settings',
    permissions: [
      def('Settings.Global.Read', 'View global settings', 'Host'),
      def('Settings.Global.Manage', 'Modify global settings', 'Host'),
      def('Settings.Tenant.Read', 'View tenant settings', 'Tenant'),
      def('Settings.Tenant.Manage', 'Modify tenant settings', 'Tenant'),
    ],
  },
];

/** Mutable map of role → granted permission names. */
export const mockRoleGrants: Record<string, string[]> = {
  admin: [
    'Showcase.Users.Read',
    'Showcase.Users.Manage',
    'Showcase.Countries.Read',
    'Showcase.Countries.Manage',
    'AI.Workspaces.Read',
    'AI.Workspaces.Manage',
    'AI.Usage.Read',
    'AI.Chat.Execute',
    'AI.Embeddings.Execute',
    'AuthenticationApiKeys.Keys.Read',
    'AuthenticationApiKeys.Keys.Create',
    'AuthenticationApiKeys.Keys.Revoke',
    'AuthenticationApiKeys.Keys.Rotate',
    'AuthenticationApiKeys.Keys.UpdateScopes',
    'Authorization.Definitions.Read',
    'Authorization.Grants.Manage',
    'BackgroundJobs.Jobs.Read',
    'BackgroundJobs.Jobs.Manage',
    'Features.Flags.Read',
    'Features.Flags.Manage',
    'Identity.Users.Read',
    'Identity.Users.Manage',
    'Identity.Roles.Read',
    'Identity.Roles.Manage',
    'Settings.Global.Read',
    'Settings.Global.Manage',
    'Settings.Tenant.Read',
    'Settings.Tenant.Manage',
  ],
  viewer: [
    'Showcase.Users.Read',
    'Showcase.Countries.Read',
    'AI.Workspaces.Read',
    'AI.Usage.Read',
    'AuthenticationApiKeys.Keys.Read',
    'Authorization.Definitions.Read',
    'BackgroundJobs.Jobs.Read',
    'Features.Flags.Read',
    'Identity.Users.Read',
    'Identity.Roles.Read',
    'Settings.Global.Read',
    'Settings.Tenant.Read',
  ],
};

/** Mock rows for the `GET /grants` query surface. */
export const mockPermissionGrants: PermissionGrant[] = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    name: 'Showcase.Users.Manage',
    providerName: 'R',
    providerKey: 'admin',
    tenantId: null,
    createdAt: '2026-01-01T00:00:00Z',
    createdBy: 'system',
    modifiedAt: null,
    modifiedBy: null,
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    name: 'Showcase.Users.Read',
    providerName: 'R',
    providerKey: 'viewer',
    tenantId: null,
    createdAt: '2026-01-01T00:00:00Z',
    createdBy: 'system',
    modifiedAt: null,
    modifiedBy: null,
  },
];

/** Mock rows for the `GET /role-metadata` query surface. */
export const mockRoleMetadata: RoleMetadata[] = [
  {
    id: '00000000-0000-0000-0000-0000000000a1',
    name: 'admin',
    tenantId: null,
    clientId: null,
    multiTenancySides: 'Both',
    description: 'Full administrative access',
    isSystem: true,
    isOrphaned: false,
    orphanedAt: null,
    concurrencyStamp: 'stamp-admin',
    createdAt: '2026-01-01T00:00:00Z',
    createdBy: 'system',
    modifiedAt: null,
    modifiedBy: null,
  },
  {
    id: '00000000-0000-0000-0000-0000000000a2',
    name: 'viewer',
    tenantId: null,
    clientId: null,
    multiTenancySides: 'Tenant',
    description: 'Read-only access',
    isSystem: false,
    isOrphaned: false,
    orphanedAt: null,
    concurrencyStamp: 'stamp-viewer',
    createdAt: '2026-01-01T00:00:00Z',
    createdBy: 'system',
    modifiedAt: null,
    modifiedBy: null,
  },
];
