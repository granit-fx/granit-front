import type { PermissionDefinitionDto, PermissionGroupDto } from '@granit/authorization';

export const mockPermissionGroups: PermissionGroupDto[] = [
  {
    name: 'Showcase',
    displayName: 'Showcase Application',
    permissions: [
      { name: 'Showcase.Users.Read', displayName: 'View users' },
      { name: 'Showcase.Users.Manage', displayName: 'Create, edit, disable users' },
      { name: 'Showcase.Countries.Read', displayName: 'View countries' },
      { name: 'Showcase.Countries.Manage', displayName: 'Create, edit, deactivate countries' },
    ] as PermissionDefinitionDto[],
  },
  {
    name: 'AI',
    displayName: 'AI Management',
    permissions: [
      { name: 'AI.Workspaces.Read', displayName: 'View AI workspaces' },
      { name: 'AI.Workspaces.Manage', displayName: 'Create, edit, delete AI workspaces' },
      { name: 'AI.Usage.Read', displayName: 'View AI usage statistics' },
      { name: 'AI.Chat.Execute', displayName: 'Execute AI chat completions' },
      { name: 'AI.Embeddings.Execute', displayName: 'Execute AI embeddings' },
    ] as PermissionDefinitionDto[],
  },
  {
    name: 'AuthenticationApiKeys',
    displayName: 'API Key Management',
    permissions: [
      { name: 'AuthenticationApiKeys.Keys.Read', displayName: 'View API keys' },
      { name: 'AuthenticationApiKeys.Keys.Create', displayName: 'Create API keys' },
      { name: 'AuthenticationApiKeys.Keys.Revoke', displayName: 'Revoke API keys' },
      { name: 'AuthenticationApiKeys.Keys.Rotate', displayName: 'Rotate API keys' },
      {
        name: 'AuthenticationApiKeys.Keys.UpdateScopes',
        displayName: 'Update API key scopes and CIDR',
      },
    ] as PermissionDefinitionDto[],
  },
  {
    name: 'Authorization',
    displayName: 'Authorization',
    permissions: [
      { name: 'Authorization.Definitions.Read', displayName: 'View permission definitions' },
      { name: 'Authorization.Grants.Manage', displayName: 'Manage permission grants' },
    ] as PermissionDefinitionDto[],
  },
  {
    name: 'BackgroundJobs',
    displayName: 'Background Jobs',
    permissions: [
      { name: 'BackgroundJobs.Jobs.Read', displayName: 'View background jobs' },
      { name: 'BackgroundJobs.Jobs.Manage', displayName: 'Manage jobs (pause, resume, trigger)' },
    ] as PermissionDefinitionDto[],
  },
  {
    name: 'Features',
    displayName: 'Feature Flags',
    permissions: [
      { name: 'Features.Flags.Read', displayName: 'View feature flags' },
      { name: 'Features.Flags.Manage', displayName: 'Manage feature flags' },
    ] as PermissionDefinitionDto[],
  },
  {
    name: 'Identity',
    displayName: 'Identity',
    permissions: [
      { name: 'Identity.Users.Read', displayName: 'View identity users' },
      { name: 'Identity.Users.Manage', displayName: 'Manage identity users' },
      { name: 'Identity.Roles.Read', displayName: 'View identity roles' },
      { name: 'Identity.Roles.Manage', displayName: 'Manage identity roles' },
    ] as PermissionDefinitionDto[],
  },
  {
    name: 'Settings',
    displayName: 'Application Settings',
    permissions: [
      { name: 'Settings.Global.Read', displayName: 'View global settings' },
      { name: 'Settings.Global.Manage', displayName: 'Modify global settings' },
      { name: 'Settings.Tenant.Read', displayName: 'View tenant settings' },
      { name: 'Settings.Tenant.Manage', displayName: 'Modify tenant settings' },
    ] as PermissionDefinitionDto[],
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
