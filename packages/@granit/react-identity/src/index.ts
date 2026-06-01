// Provider
export {
  IdentityProvider,
  buildIdentityQueryKey,
  useIdentityConfig,
} from './providers/identity-provider';
export type { IdentityConfig, IdentityProviderProps } from './providers/identity-provider';

// Hooks — Cache
export { useIdentityCacheStats, useBatchResolveUsers } from './hooks/use-identity-cache';
export { useIdentityCapabilities } from './hooks/use-identity-capabilities';
export { useIdentityRgpd } from './hooks/use-identity-rgpd';
export { useIdentitySync } from './hooks/use-identity-sync';
export { useIdentityUser, useIdentityUsers } from './hooks/use-identity-users';

// Hooks — Provider users
export {
  useCreateUser,
  useProviderUser,
  useProviderUsers,
  useSetUserEnabled,
  useUpdateUser,
} from './hooks/use-identity-provider-users';
export type {
  SetUserEnabledVariables,
  UpdateUserVariables,
} from './hooks/use-identity-provider-users';

// Hooks — Roles
export {
  useAssignRole,
  useRemoveRole,
  useRoleMembers,
  useRoles,
  useUserRoles,
} from './hooks/use-identity-roles';
export type { RoleMutationVariables } from './hooks/use-identity-roles';

// Hooks — Groups
export {
  useAddUserToGroup,
  useGroups,
  useRemoveUserFromGroup,
  useUserGroups,
} from './hooks/use-identity-groups';
export type { GroupMutationVariables } from './hooks/use-identity-groups';

// Hooks — Sessions
export {
  useTerminateAllSessions,
  useTerminateSession,
  useUserDeviceActivity,
  useUserSessions,
} from './hooks/use-identity-sessions';
export type { TerminateSessionVariables } from './hooks/use-identity-sessions';

// Hooks — Passwords
export {
  usePasswordChangedAt,
  useSendPasswordResetEmail,
  useSetTemporaryPassword,
} from './hooks/use-identity-passwords';
export type { SetTemporaryPasswordVariables } from './hooks/use-identity-passwords';
