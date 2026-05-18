import type { Logger } from '@granit/logger';
import type { EntityId, ISODateString, TenantId } from '@granit/types';

// ---------------------------------------------------------------------------
// BFF authentication types — mirrors Granit.Bff .NET contract
//
// Since granit-dotnet EPIC #2133 (Story #2134), `BffUserResponse.IsHost`
// is the authoritative Host/Tenant marker emitted by the BFF, with the
// invariant `IsHost ⇔ tenant_id claim absent`. The front mirrors that
// invariant in the type system via a discriminated union — a tenant user
// is guaranteed to carry `tenantId: string`, a host user is guaranteed to
// have no `tenantId` field.
// ---------------------------------------------------------------------------

/** Common fields shared by every authenticated user. */
interface BffAuthenticatedUserBase {
  readonly authenticated: true;
  readonly sub: string;
  readonly name: string;
  readonly email: string;
  readonly roles: readonly string[];
  readonly sessionExpiresAt: ISODateString;
}

/** Tenant-scoped user — must carry a non-empty `tenantId`. */
export interface BffTenantUser extends BffAuthenticatedUserBase {
  readonly isHost: false;
  readonly tenantId: TenantId;
}

/** Host (cross-tenant) user — must NOT carry a `tenantId`. */
export interface BffHostUser extends BffAuthenticatedUserBase {
  readonly isHost: true;
}

/** Authenticated user returned by GET /{prefix}/bff/user. */
export type BffUser = BffTenantUser | BffHostUser;

/** Unauthenticated response from GET /{prefix}/bff/user. */
export interface BffUnauthenticated {
  readonly authenticated: false;
}

/** Union type for the /bff/user endpoint response. */
export type BffUserResponse = BffUser | BffUnauthenticated;

/** Branded BFF session identifier. */
export type BffSessionId = EntityId<'BffSession'>;

/** A single BFF session entry. Session IDs are masked server-side for security. */
export interface BffSessionInfo {
  /** Masked session identifier (e.g. "ab12...yz89"). */
  readonly sessionId: BffSessionId;
  /** Whether this is the calling session. */
  readonly isCurrent: boolean;
  /** When the session was created. ISO 8601 string. */
  readonly createdAt: ISODateString;
  /** User-Agent string captured at session creation, if available. */
  readonly userAgent: string | null;
}

/** Response from GET /{prefix}/bff/sessions. */
export interface BffSessionListResponse {
  readonly sessions: readonly BffSessionInfo[];
}

/** Configuration for the BFF authentication provider. */
export interface BffConfig {
  /** Path prefix for this frontend (e.g., "/admin"). */
  readonly pathPrefix: string;
  /** Called when /bff/user returns authenticated: false. Default: redirect to login. */
  readonly onUnauthenticated?: () => void;
  /** Polling interval for session check in ms. Default: 60000 (1 minute). 0 = disabled. */
  readonly sessionCheckInterval?: number;
  /**
   * Optional logger from `@granit/logger`. Receives session-check failures
   * (network errors, malformed responses). Production apps should wire a
   * redacting logger so transient auth errors don't leak PII into `console`.
   * Defaults to a `console.warn` fallback when omitted.
   */
  readonly logger?: Logger;
}
