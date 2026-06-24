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
export type {
  DeviceKind,
  UserDeviceId,
  UserDeviceResponse,
  UserSessionId,
  UserSessionResponse,
  UserSessionRiskLevel,
  UserSessionsRevokedResponse,
} from './types/index';
export type {
  SessionReviewContextResponse,
  SessionReviewDecision,
  SessionReviewDecisionRequest,
  SessionReviewResultResponse,
} from './types/index';
export type { GeoLocation } from './types/index';
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
  pseudonymizeUserCache,
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
  listUserDevices,
  listUserSessions,
  terminateAllSessions,
  terminateSession,
} from './api/identity-provider-session-api';

// API — Self-service sessions/devices (the caller's own)
export {
  listMyUserDevices,
  listMyUserSessions,
  revokeMyOtherUserSessions,
  revokeMyUserSession,
} from './api/user-session-api';

// API — Session review ("Was this you?" — anonymous, token-protected)
export { getSessionReviewContext, submitSessionReview } from './api/session-review-api';
export {
  getPasswordChangedAt,
  sendPasswordResetEmail,
  setTemporaryPassword,
} from './api/identity-provider-password-api';
export { IdentityPermissions } from './permissions';

// Device label composition
export { composeDeviceLabel } from './device-label';
export type { DeviceLabelStrings } from './device-label';

// User-Agent parsing (shared by session management UI and passkey naming)
export { isHandheldUserAgent, parseUserAgent } from './parse-user-agent';
export type { ParsedUserAgent } from './parse-user-agent';
