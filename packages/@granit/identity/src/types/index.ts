export type {
  IdentityUser,
  IdentityUserCacheStats,
  IdentityUserCacheSyncAllResult,
  IdentityUserCacheSyncStaleResult,
  IdentityUserListParams,
  IdentityUserPage,
} from './identity-user.js';

export type { IdentityRole, IdentityRoleId } from './identity-role.js';
export type { IdentityGroup, IdentityGroupId } from './identity-group.js';
export type {
  IdentityDeviceActivity,
  IdentitySession,
  IdentitySessionId,
} from './identity-session.js';
export type { IdentityPasswordChangedAtResponse } from './identity-password.js';
export type {
  IdentitySetTemporaryPasswordRequest,
  IdentityUserCreateRequest,
  IdentityUserSetEnabledRequest,
  IdentityUserUpdateRequest,
} from './identity-provider-requests.js';

/** Response from `GET /identity/users/capabilities`. */
export interface IdentityProviderCapabilities {
  /** Display name of the active identity provider (e.g. "Keycloak", "Entra ID"). */
  readonly providerName: string;
  /** Whether the provider can terminate a specific session without revoking all sessions. */
  readonly supportsIndividualSessionTermination: boolean;
  /** Whether the provider can send a password reset email natively. */
  readonly supportsNativePasswordResetEmail: boolean;
  /** Whether the provider supports hierarchical group structures (sub-groups). */
  readonly supportsGroupHierarchy: boolean;
  /** Whether the provider supports custom user attributes. */
  readonly supportsCustomAttributes: boolean;
  /** Maximum number of custom attributes (0 if not supported). */
  readonly maxCustomAttributes: number;
  /** Whether the provider supports credential verification (ROPC or equivalent). */
  readonly supportsCredentialVerification: boolean;
  /** Whether the provider supports creating new user accounts. */
  readonly supportsUserCreation: boolean;
}
