// URL safety helpers — guard `location.href = …`, `<a href={…}>`, and other
// DOM sinks against server-controlled URLs carrying dangerous schemes
// (`javascript:`, `data:`, `vbscript:`, …). See security audit VULN-101.

/** Schemes allowed for full-page navigation (`location.href`, `location.assign`). */
export const NAV_URL_SCHEMES: ReadonlySet<string> = new Set(['http:', 'https:']);

/** Schemes allowed for anchor `href` attributes rendered from server data. */
export const LINK_URL_SCHEMES: ReadonlySet<string> = new Set([
  'http:',
  'https:',
  'mailto:',
  'tel:',
]);

function parseUrl(input: string): URL | null {
  const base = globalThis.location?.href ?? 'http://localhost/';
  try {
    return new URL(input, base);
  } catch {
    return null;
  }
}

/**
 * Returns `true` when `input` is safe to use as a navigation target or link
 * `href`. Same-origin relative URLs (`/path`, `path`) are always allowed;
 * absolute URLs must use a scheme in `allowedSchemes`.
 *
 * Protocol-relative URLs (`//evil.com`) are rejected — they inherit the
 * current scheme and would let an attacker redirect off-origin.
 */
export function isSafeUrl(
  input: string,
  allowedSchemes: ReadonlySet<string> = NAV_URL_SCHEMES
): boolean {
  if (typeof input !== 'string' || input === '') return false;
  if (input.startsWith('//')) return false;
  if (input.startsWith('/')) return true;
  const url = parseUrl(input);
  if (url === null) return false;
  return allowedSchemes.has(url.protocol);
}

/**
 * Returns `input` unchanged when safe; throws `Error` otherwise. Use to gate
 * server-controlled URLs before assigning them to a DOM sink.
 *
 * @throws Error when the URL is malformed or uses a disallowed scheme.
 */
export function assertSafeUrl(
  input: string,
  allowedSchemes: ReadonlySet<string> = NAV_URL_SCHEMES
): string {
  if (!isSafeUrl(input, allowedSchemes)) {
    const preview = typeof input === 'string' ? input.slice(0, 60) : String(input);
    throw new Error(`[@granit/utils] Unsafe URL rejected: "${preview}"`);
  }
  return input;
}
