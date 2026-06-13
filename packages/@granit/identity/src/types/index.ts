export type {
  IdentityUser,
  IdentityUserCacheStats,
  IdentityUserCacheSyncAllResult,
  IdentityUserCacheSyncStaleResult,
  IdentityUserListParams,
  IdentityUserPage,
} from './identity-user';

export type { IdentityRole, IdentityRoleId } from './identity-role';
export type { IdentityGroup, IdentityGroupId } from './identity-group';
export type {
  UserDeviceId,
  UserDeviceResponse,
  UserSessionId,
  UserSessionResponse,
  UserSessionsRevokedResponse,
} from './user-session';
export type {
  SessionReviewContextResponse,
  SessionReviewDecision,
  SessionReviewDecisionRequest,
  SessionReviewResultResponse,
} from './session-review';

// Shared session/device contracts re-exported so consumers can type the
// `location` / `riskLevel` / `kind` fields without reaching into the owning
// packages.
export type { GeoLocation } from '@granit/ip-geolocation';
export type { DeviceKind, UserSessionRiskLevel } from '@granit/identity-abstractions';

export type { IdentityPasswordChangedAtResponse } from './identity-password';
export type {
  IdentitySetTemporaryPasswordRequest,
  IdentityUserCreateRequest,
  IdentityUserSetEnabledRequest,
  IdentityUserUpdateRequest,
} from './identity-provider-requests';

/** Query parameters for `GET {basePath}/users`. */
export type IdentityProviderUserListParams = {
  readonly search?: string;
  readonly first?: number;
  readonly max?: number;
};

/** Response from `GET /identity/users/capabilities`. */
export interface IdentityProviderCapabilitiesResponse {
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
  /** Whether tenant admins can create, update, and delete groups via the API. */
  readonly supportsGroupManagement: boolean;
}
