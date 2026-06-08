// Types
export type { IdentityProviderCapabilitiesResponse } from './types/index';
export type {
  IdentityUser,
  IdentityUserCacheStats,
  IdentityUserCacheSyncAllResult,
  IdentityUserCacheSyncStaleResult,
  IdentityUserListParams,
  IdentityUserPage,
} from './types/index';
export type { IdentityRole, IdentityRoleId } from './types/index';
export type { IdentityGroup, IdentityGroupId } from './types/index';
export type { IdentityDeviceActivity, IdentitySession, IdentitySessionId } from './types/index';
export type { IdentityPasswordChangedAtResponse } from './types/index';
export type {
  IdentitySetTemporaryPasswordRequest,
  IdentityUserCreateRequest,
  IdentityUserSetEnabledRequest,
  IdentityUserUpdateRequest,
} from './types/index';
export type { IdentityProviderUserListParams } from './types/index';

// API — User cache
export { getIdentityCapabilities } from './api/identity-capabilities-api';
export {
  batchResolveUsers,
  eraseUserCache,
  getCacheStats,
  getUserById,
  searchUsers,
  syncAllUsers,
  syncStaleUsers,
  syncUsers,
} from './api/identity-user-cache-api';

// API — Identity provider
export {
  createUser,
  getProviderUser,
  listProviderUsers,
  setUserEnabled,
  updateUser,
} from './api/identity-provider-user-api';
export {
  assignRole,
  listRoleMembers,
  listRoles,
  listUserRoles,
  removeRole,
} from './api/identity-provider-role-api';
export {
  addUserToGroup,
  listGroups,
  listUserGroups,
  removeUserFromGroup,
} from './api/identity-provider-group-api';
export {
  getUserDeviceActivity,
  listUserSessions,
  terminateAllSessions,
  terminateSession,
} from './api/identity-provider-session-api';
export {
  getPasswordChangedAt,
  sendPasswordResetEmail,
  setTemporaryPassword,
} from './api/identity-provider-password-api';
export { IdentityPermissions } from './permissions';
