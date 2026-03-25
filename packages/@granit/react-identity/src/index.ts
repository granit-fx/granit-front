// Provider
export {
  IdentityProvider,
  buildIdentityQueryKey,
  useIdentityConfig,
} from './providers/identity-provider.js';
export type { IdentityConfig, IdentityProviderProps } from './providers/identity-provider.js';

// Hooks — Cache
export { useIdentityCacheStats, useBatchResolveUsers } from './hooks/use-identity-cache.js';
export { useIdentityCapabilities } from './hooks/use-identity-capabilities.js';
export { useIdentityRgpd } from './hooks/use-identity-rgpd.js';
export { useIdentitySync } from './hooks/use-identity-sync.js';
export { useIdentityUser, useIdentityUsers } from './hooks/use-identity-users.js';

// Hooks — Provider users
export {
  useCreateUser,
  useProviderUser,
  useProviderUsers,
  useSetUserEnabled,
  useUpdateUser,
} from './hooks/use-identity-provider-users.js';
export type {
  SetUserEnabledVariables,
  UpdateUserVariables,
} from './hooks/use-identity-provider-users.js';

// Hooks — Roles
export {
  useAssignRole,
  useRemoveRole,
  useRoleMembers,
  useRoles,
  useUserRoles,
} from './hooks/use-identity-roles.js';
export type { RoleMutationVariables } from './hooks/use-identity-roles.js';

// Hooks — Groups
export {
  useAddUserToGroup,
  useGroups,
  useRemoveUserFromGroup,
  useUserGroups,
} from './hooks/use-identity-groups.js';
export type { GroupMutationVariables } from './hooks/use-identity-groups.js';

// Hooks — Sessions
export {
  useTerminateAllSessions,
  useTerminateSession,
  useUserDeviceActivity,
  useUserSessions,
} from './hooks/use-identity-sessions.js';
export type { TerminateSessionVariables } from './hooks/use-identity-sessions.js';

// Hooks — Passwords
export {
  usePasswordChangedAt,
  useSendPasswordResetEmail,
  useSetTemporaryPassword,
} from './hooks/use-identity-passwords.js';
export type { SetTemporaryPasswordVariables } from './hooks/use-identity-passwords.js';
