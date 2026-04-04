// Types
export type { IdentityProviderCapabilities } from './types/index.js';
export type {
  IdentityUser,
  IdentityUserCacheStats,
  IdentityUserCacheSyncAllResult,
  IdentityUserCacheSyncStaleResult,
  IdentityUserListParams,
  IdentityUserPage,
} from './types/index.js';
export type { IdentityRole, IdentityRoleId } from './types/index.js';
export type { IdentityGroup, IdentityGroupId } from './types/index.js';
export type { IdentityDeviceActivity, IdentitySession, IdentitySessionId } from './types/index.js';
export type { IdentityPasswordChangedAtResponse } from './types/index.js';
export type {
  IdentitySetTemporaryPasswordRequest,
  IdentityUserCreateRequest,
  IdentityUserSetEnabledRequest,
  IdentityUserUpdateRequest,
} from './types/index.js';

// API — User cache
export { fetchIdentityCapabilities } from './api/identity-capabilities-api.js';
export {
  batchResolveUsers,
  eraseUserCache,
  getCacheStats,
  getUserById,
  searchUsers,
  syncAllUsers,
  syncStaleUsers,
  syncUsers,
} from './api/identity-user-cache-api.js';

// API — Identity provider
export type { IdentityProviderUserListParams } from './api/identity-provider-user-api.js';
export {
  createUser,
  fetchProviderUser,
  fetchProviderUsers,
  setUserEnabled,
  updateUser,
} from './api/identity-provider-user-api.js';
export {
  assignRole,
  fetchRoleMembers,
  fetchRoles,
  fetchUserRoles,
  removeRole,
} from './api/identity-provider-role-api.js';
export {
  addUserToGroup,
  fetchGroups,
  fetchUserGroups,
  removeUserFromGroup,
} from './api/identity-provider-group-api.js';
export {
  fetchUserDeviceActivity,
  fetchUserSessions,
  terminateAllSessions,
  terminateSession,
} from './api/identity-provider-session-api.js';
export {
  fetchPasswordChangedAt,
  sendPasswordResetEmail,
  setTemporaryPassword,
} from './api/identity-provider-password-api.js';
