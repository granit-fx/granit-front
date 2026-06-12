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
  /** Display name. `''` when the id_token carries no `name` claim (backend `string?`). */
  readonly name: string;
  /** Email. `''` when the id_token carries no `email` claim (backend `string?`). */
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

/**
 * Coarse session risk classification. Mirrors `Granit.UserSessions.UserSessionRiskLevel`,
 * serialized as its string name via the framework's `JsonStringEnumConverter`.
 *
 * `'None'` means anomaly detection ran and found nothing; a *null* `riskLevel`
 * on {@link BffSessionInfo} means no verdict was stored (detection not installed).
 */
export type BffSessionRiskLevel = 'None' | 'Low' | 'Medium' | 'High';

/**
 * Approximate geographic location of a session, resolved from its IP address.
 * Mirrors `Granit.IpGeolocation.GeoLocation` — every member is independently
 * optional (a country-only data source leaves city/region/coordinates null).
 *
 * These strings originate from a geolocation data source and are display-only:
 * render them as text, never as HTML.
 */
export interface BffSessionLocation {
  /** City name (e.g. "Brussels"), when resolved to city granularity. */
  readonly city: string | null;
  /** Most specific subdivision — region/state/province (e.g. "Brussels-Capital"). */
  readonly region: string | null;
  /** Country display name (e.g. "Belgium"). */
  readonly country: string | null;
  /** ISO 3166-1 alpha-2 country code (e.g. "BE"). */
  readonly countryCode: string | null;
  /** Approximate latitude in decimal degrees, when available. */
  readonly latitude: number | null;
  /** Approximate longitude in decimal degrees, when available. */
  readonly longitude: number | null;
}

/** A single BFF session entry. Session IDs are masked server-side for security. */
export interface BffSessionInfo {
  /** Masked session identifier (e.g. "ab12...yz89"). */
  readonly sessionId: BffSessionId;
  /** Whether this is the calling session. */
  readonly isCurrent: boolean;
  /** When the session was created. ISO 8601 string. */
  readonly createdAt: ISODateString;
  /**
   * User-Agent string captured at session creation, if available.
   *
   * Client-controlled free text — display-only and length-bounded by the
   * parser; never interpolate into HTML.
   */
  readonly userAgent: string | null;
  /**
   * When the session was last used. Null when the backend has not recorded an
   * access since creation. ISO 8601 string. (Backend `LastAccessedAt`.)
   */
  readonly lastAccessedAt: ISODateString | null;
  /** Approximate geolocation of the session IP, or null when unresolved. */
  readonly location: BffSessionLocation | null;
  /**
   * Session IP address — masked by default, raw only when the BFF is configured
   * with `ExposeRawIpAddress`. Null when unavailable.
   */
  readonly ipAddress: string | null;
  /** Coarse risk level, or null when no verdict was stored for the session. */
  readonly riskLevel: BffSessionRiskLevel | null;
}

/** Response from GET /{prefix}/bff/sessions. */
export interface BffSessionListResponse {
  readonly sessions: readonly BffSessionInfo[];
}

/** Response from POST /{prefix}/bff/csrf-token. Mirrors Granit.Bff `BffCsrfTokenResponse`. */
export interface BffCsrfTokenResponse {
  readonly csrfToken: string;
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
