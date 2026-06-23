import { logger } from './logger';

import type { CookieCategory, ConsentState } from './types/index';

/**
 * Attributes applied when writing a cookie via {@link setConsentedCookie} or
 * clearing one via {@link removeCookie}. Mirrors the standard `document.cookie`
 * attributes with safe defaults (`path: '/'`, `secure: true`, `sameSite: 'lax'`).
 */
export interface CookieAttributes {
  /** Cookie path (default `'/'`). */
  path?: string;
  /** Cookie domain (default: current host). */
  domain?: string;
  /** Lifetime in seconds (`Max-Age`). Takes precedence over nothing; combine freely with `expires`. */
  maxAge?: number;
  /** Absolute expiry (`Expires`). */
  expires?: Date;
  /** `Secure` flag (default `true`). */
  secure?: boolean;
  /** `SameSite` policy (default `'lax'`). */
  sameSite?: 'strict' | 'lax' | 'none';
}

/**
 * Options for {@link setConsentedCookie}: the consent {@link CookieCategory} the
 * cookie belongs to plus the current {@link ConsentState} to gate the write.
 */
export interface ConsentedCookieOptions extends CookieAttributes {
  /** Consent category this cookie belongs to. */
  category: CookieCategory;
  /** Current consent state — the cookie is only written when this grants `category`. */
  consents: ConsentState;
}

/**
 * Whether a category may be written given a consent state. `strictly_necessary`
 * cookies never require consent; every other category must be explicitly granted.
 */
function isCategoryGranted(category: CookieCategory, consents: ConsentState): boolean {
  return category === 'strictly_necessary' || consents[category] === true;
}

const SAME_SITE_LABEL: Record<NonNullable<CookieAttributes['sameSite']>, string> = {
  strict: 'Strict',
  lax: 'Lax',
  none: 'None',
};

function serializeAttributes(attributes: CookieAttributes): string {
  const { path = '/', domain, maxAge, expires, secure = true, sameSite = 'lax' } = attributes;

  const parts = [`Path=${path}`];
  if (domain !== undefined) parts.push(`Domain=${domain}`);
  if (maxAge !== undefined) parts.push(`Max-Age=${maxAge}`);
  if (expires !== undefined) parts.push(`Expires=${expires.toUTCString()}`);
  parts.push(`SameSite=${SAME_SITE_LABEL[sameSite]}`);
  // `SameSite=None` is only valid alongside `Secure`; default-secure keeps it consistent.
  if (secure || sameSite === 'none') parts.push('Secure');

  return parts.join('; ');
}

/**
 * Read a cookie value by name. Returns the decoded value, or `null` if the
 * cookie is absent or `document` is unavailable (SSR).
 */
export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;

  const target = `${encodeURIComponent(name)}=`;
  for (const part of document.cookie.split(';')) {
    const trimmed = part.trim();
    if (trimmed.startsWith(target)) {
      return decodeURIComponent(trimmed.slice(target.length));
    }
  }
  return null;
}

/**
 * Write a cookie **only if** the user has consented to its category.
 *
 * `strictly_necessary` cookies are always written; every other category is
 * gated on `options.consents[category]`. No-op on the server (`document`
 * undefined).
 *
 * @returns `true` if the cookie was written, `false` if consent was missing
 * or `document` is unavailable.
 *
 * @example
 * ```typescript
 * const { consents } = useCookieConsent();
 * setConsentedCookie('analytics_id', id, { category: 'analytics', consents });
 * ```
 */
export function setConsentedCookie(
  name: string,
  value: string,
  options: ConsentedCookieOptions
): boolean {
  if (typeof document === 'undefined') return false;

  const { category, consents, ...attributes } = options;
  if (!isCategoryGranted(category, consents)) {
    // Value intentionally omitted from logs (may carry PII).
    logger.debug('Cookie write blocked: consent not granted', { name, category });
    return false;
  }

  const pair = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;
  document.cookie = `${pair}; ${serializeAttributes(attributes)}`;
  logger.debug('Cookie written', { name, category });
  return true;
}

/**
 * Delete a cookie by expiring it in the past. Pass the same `path`/`domain`
 * attributes that were used to write it, otherwise the browser keeps the
 * original cookie. No-op on the server.
 */
export function removeCookie(
  name: string,
  attributes: Omit<CookieAttributes, 'maxAge' | 'expires'> = {}
): void {
  if (typeof document === 'undefined') return;

  const expired = serializeAttributes({ ...attributes, expires: new Date(0), maxAge: 0 });
  document.cookie = `${encodeURIComponent(name)}=; ${expired}`;
}
