import type { EntityId, ISODateString, TenantId } from '@granit/types';

// ---------------------------------------------------------------------------
// BFF authentication types — mirrors Granit.Bff .NET contract
// ---------------------------------------------------------------------------

/** Authenticated user returned by GET /{prefix}/bff/user. */
export interface BffUser {
  readonly authenticated: true;
  readonly sub: string;
  readonly name: string;
  readonly email: string;
  readonly roles: readonly string[];
  readonly tenantId?: TenantId;
  readonly sessionExpiresAt: ISODateString;
}

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
}
