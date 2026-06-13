import type { Logger } from '@granit/logger';
import type { ISODateString, TenantId } from '@granit/types';

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

// Session listing/revocation moved off the BFF (granit-dotnet #2692): the
// caller's own sessions are now served by the canonical, transport-agnostic
// `/sessions` (+ `/devices`) endpoints — see `@granit/identity`
// (`listMySessions`, `revokeMySession`, …) and `@granit/react-identity`
// (`useMySessions`, …). The BFF retains only auth bootstrap (`/bff/user`) and
// CSRF (`/bff/csrf-token`).

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
