// ---------------------------------------------------------------------------
// Runtime validator for the GET /{prefix}/bff/user response.
//
// The BFF is first-party but its response crosses a network boundary, may be
// rewritten by misconfigured proxies / captive portals, and must respect the
// invariant `IsHost ⇔ tenant_id absent`. The validator enforces the
// discriminated-union shape so the auth context never observes a malformed
// state. No external dep (zod, ajv) — the contract is finite and stable.
// ---------------------------------------------------------------------------

import type {
  BffHostUser,
  BffTenantUser,
  BffUnauthenticated,
  BffUserResponse,
} from '../types/index';
import type { ISODateString, TenantId } from '@granit/types';

/** Discriminated result mirroring zod's safeParse. */
export type ParseResult<T> =
  | { readonly success: true; readonly data: T }
  | { readonly success: false; readonly issues: readonly string[] };

function isObject(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null;
}

function isString(x: unknown): x is string {
  return typeof x === 'string';
}

function isNonEmptyString(x: unknown): x is string {
  return typeof x === 'string' && x.length > 0;
}

function isStringArray(x: unknown): x is readonly string[] {
  return Array.isArray(x) && x.every(isString);
}

function isIsoDate(x: unknown): x is string {
  if (!isString(x)) return false;
  // Loose ISO-8601 sanity check — full grammar is enforced server-side.
  return /^\d{4}-\d{2}-\d{2}T/.test(x);
}

/** Asserts the common authenticated-user fields. */
function readAuthenticatedBase(
  obj: Record<string, unknown>,
  issues: string[]
): {
  sub: string;
  name: string;
  email: string;
  roles: readonly string[];
  sessionExpiresAt: ISODateString;
} | null {
  let ok = true;
  if (!isNonEmptyString(obj.sub)) {
    issues.push('field "sub" must be a non-empty string');
    ok = false;
  }
  // Backend emits `name`/`email` as nullable (`string?`): a session whose
  // id_token carries no profile/email claim is still authenticated. Map a
  // null/absent claim to '' instead of rejecting the whole response — the
  // previous strict check silently forced such a valid user into the
  // unauthenticated state. A present-but-non-string value is still malformed.
  const name = obj.name ?? '';
  if (typeof name !== 'string') {
    issues.push('field "name" must be a string when present');
    ok = false;
  }
  const email = obj.email ?? '';
  if (typeof email !== 'string') {
    issues.push('field "email" must be a string when present');
    ok = false;
  }
  if (!isStringArray(obj.roles)) {
    issues.push('field "roles" must be a string array');
    ok = false;
  }
  if (!isIsoDate(obj.sessionExpiresAt)) {
    issues.push('field "sessionExpiresAt" must be an ISO-8601 string');
    ok = false;
  }
  if (!ok) return null;
  return {
    sub: obj.sub as string,
    name: name as string,
    email: email as string,
    roles: obj.roles as readonly string[],
    sessionExpiresAt: obj.sessionExpiresAt as ISODateString,
  };
}

/**
 * Parse a raw `/bff/user` response into a typed {@link BffUserResponse}.
 *
 * Enforces the granit-dotnet contract:
 * - `authenticated: false` → unauthenticated, no other fields required.
 * - `authenticated: true`, `isHost: false` → tenant user, MUST carry
 *   non-empty `tenantId`.
 * - `authenticated: true`, `isHost: true` → host user, MUST NOT carry
 *   `tenantId`.
 *
 * Any deviation returns `{ success: false, issues: [...] }`; the caller
 * should treat the response as untrustworthy (typically: log + force
 * unauthenticated state).
 */
export function parseBffSessionResponse(raw: unknown): ParseResult<BffUserResponse> {
  const issues: string[] = [];

  if (!isObject(raw)) {
    return { success: false, issues: ['response body is not a JSON object'] };
  }

  if (raw.authenticated === false) {
    const result: BffUnauthenticated = { authenticated: false };
    return { success: true, data: result };
  }

  if (raw.authenticated !== true) {
    return {
      success: false,
      issues: ['field "authenticated" must be a boolean literal (true or false)'],
    };
  }

  if (typeof raw.isHost !== 'boolean') {
    issues.push('field "isHost" must be a boolean');
  }

  const base = readAuthenticatedBase(raw, issues);

  if (raw.isHost === true) {
    if ('tenantId' in raw && raw.tenantId !== undefined && raw.tenantId !== null) {
      issues.push('host user must NOT carry a tenantId (invariant IsHost ⇔ tenantId absent)');
    }
    if (!base || issues.length > 0) {
      return { success: false, issues };
    }
    const host: BffHostUser = {
      authenticated: true,
      isHost: true,
      ...base,
    };
    return { success: true, data: host };
  }

  if (raw.isHost === false) {
    if (!isNonEmptyString(raw.tenantId)) {
      issues.push('tenant user must carry a non-empty tenantId');
    }
    if (!base || issues.length > 0) {
      return { success: false, issues };
    }
    const tenant: BffTenantUser = {
      authenticated: true,
      isHost: false,
      ...base,
      tenantId: raw.tenantId as TenantId,
    };
    return { success: true, data: tenant };
  }

  // isHost was not a boolean — already reported above.
  return { success: false, issues };
}
