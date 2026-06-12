// ---------------------------------------------------------------------------
// Runtime validator/normalizer for the GET /{prefix}/bff/sessions response.
//
// The session list crosses a network boundary and now carries enrichment fields
// (last-activity, geolocation, risk) that flow straight into "active devices"
// UI. Several fields are not first-party text:
//   - `userAgent` is fully client-controlled (an attacker sets their own header);
//   - `location.*` strings come from a geolocation data source.
// None of them is ever HTML, so we bound each free-text field to a sane length
// and coerce anything off-contract to null. React escapes text nodes, so the
// combination (plain string + bounded length, no `dangerouslySetInnerHTML`)
// keeps these values display-safe. The enum is range-checked; coordinates must
// be finite numbers. No external dep (zod, ajv) — the contract is finite.
//
// A malformed *envelope* fails the parse. A malformed individual *entry* is
// dropped rather than failing the whole list — one corrupt row should not hide
// every other active session.
// ---------------------------------------------------------------------------

import type { ParseResult } from './parse-bff-user';
import type { BffSessionId, BffSessionInfo } from '../types/index';
import type { GeoLocation } from '@granit/ip-geolocation';
import type { ISODateString } from '@granit/types';
import type { UserSessionRiskLevel } from '@granit/user-sessions';

// Length bounds for untrusted free-text fields. Generous enough for legitimate
// values, tight enough to stop an oversized string from bloating the UI/logs.
const MAX_USER_AGENT = 512;
const MAX_IP = 64;
const MAX_GEO_TEXT = 128;
const MAX_COUNTRY_CODE = 8;

const RISK_LEVELS: ReadonlySet<string> = new Set<UserSessionRiskLevel>([
  'None',
  'Low',
  'Medium',
  'High',
]);

function isObject(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null;
}

function isIsoDate(x: unknown): x is string {
  return typeof x === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(x);
}

/** Bound a free-text field: keep a trimmed string, else null. */
function boundedString(x: unknown, max: number): string | null {
  if (typeof x !== 'string') return null;
  return x.length > max ? x.slice(0, max) : x;
}

/** A coordinate is kept only when it is a finite, non-NaN number. */
function finiteNumber(x: unknown): number | null {
  return typeof x === 'number' && Number.isFinite(x) ? x : null;
}

function normalizeRiskLevel(x: unknown): UserSessionRiskLevel | null {
  return typeof x === 'string' && RISK_LEVELS.has(x) ? (x as UserSessionRiskLevel) : null;
}

function normalizeLocation(x: unknown): GeoLocation | null {
  if (!isObject(x)) return null;
  const location: GeoLocation = {
    city: boundedString(x.city, MAX_GEO_TEXT),
    region: boundedString(x.region, MAX_GEO_TEXT),
    country: boundedString(x.country, MAX_GEO_TEXT),
    countryCode: boundedString(x.countryCode, MAX_COUNTRY_CODE),
    latitude: finiteNumber(x.latitude),
    longitude: finiteNumber(x.longitude),
  };
  // A location object with no resolved member carries no information — collapse
  // it to null so the UI can treat "no location" uniformly.
  const empty =
    location.city === null &&
    location.region === null &&
    location.country === null &&
    location.countryCode === null &&
    location.latitude === null &&
    location.longitude === null;
  return empty ? null : location;
}

/**
 * Normalize a single raw session entry, or return null to drop it.
 *
 * Hard requirements: a non-empty masked `sessionId` and a valid `createdAt` —
 * an entry without them cannot be displayed or revoked, so it is discarded.
 * Everything else is best-effort normalized to the contract.
 */
function normalizeSession(raw: unknown): BffSessionInfo | null {
  if (!isObject(raw)) return null;
  if (typeof raw.sessionId !== 'string' || raw.sessionId.length === 0) return null;
  if (!isIsoDate(raw.createdAt)) return null;

  return {
    sessionId: raw.sessionId as BffSessionId,
    isCurrent: raw.isCurrent === true,
    createdAt: raw.createdAt as ISODateString,
    userAgent: boundedString(raw.userAgent, MAX_USER_AGENT),
    lastAccessedAt: isIsoDate(raw.lastAccessedAt) ? (raw.lastAccessedAt as ISODateString) : null,
    location: normalizeLocation(raw.location),
    ipAddress: boundedString(raw.ipAddress, MAX_IP),
    riskLevel: normalizeRiskLevel(raw.riskLevel),
  };
}

/**
 * Parse a raw `GET /bff/sessions` body into a sanitized, typed session list.
 *
 * Returns `{ success: false }` only when the envelope is unusable (not an
 * object, or `sessions` is not an array). When the envelope is valid, returns
 * `{ success: true, data }` with each entry normalized and length-bounded;
 * individual malformed entries are silently dropped.
 */
export function parseBffSessionList(raw: unknown): ParseResult<readonly BffSessionInfo[]> {
  if (!isObject(raw)) {
    return { success: false, issues: ['response body is not a JSON object'] };
  }
  if (!Array.isArray(raw.sessions)) {
    return { success: false, issues: ['field "sessions" must be an array'] };
  }
  const data = raw.sessions.map(normalizeSession).filter((s): s is BffSessionInfo => s !== null);
  return { success: true, data };
}
