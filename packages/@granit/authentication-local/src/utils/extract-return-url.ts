/**
 * Extract the `returnUrl` query parameter from a URL search string.
 *
 * Used after headless login to redirect the browser to the OIDC authorization
 * endpoint (`/connect/authorize`) that the Identity Server originally intended.
 *
 * Only same-origin relative URLs are accepted — absolute URLs,
 * protocol-relative URLs (`//evil.com`), and backslash-authority bypasses
 * (`/\evil.com`, `\\evil.com`, which browsers normalise off-origin) are all
 * rejected to prevent open-redirect attacks.
 *
 * @param search - URL search string (e.g. `?returnUrl=%2Fconnect%2Fauthorize`).
 *                 Defaults to `globalThis.location.search`.
 * @returns The same-origin path (`pathname` + `search` + `hash`), or `null` if
 *          absent or unsafe.
 */
export function extractReturnUrl(search?: string): string | null {
  const params = new URLSearchParams(search ?? globalThis.location?.search ?? '');
  const returnUrl = params.get('returnUrl');
  if (!returnUrl) return null;

  // Resolve against the current origin and accept only when it stays
  // same-origin. `new URL` normalises `\` → `/` in the authority exactly as a
  // browser would, so `/\evil.com` and `\\evil.com` resolve off-origin and are
  // rejected here just like `//evil.com`. Return only the path portion — never
  // a full absolute URL. See security audit VULN-202.
  const origin = globalThis.location?.origin ?? 'http://localhost';
  let resolved: URL;
  try {
    resolved = new URL(returnUrl, origin);
  } catch {
    return null;
  }
  if (resolved.origin !== origin) return null;

  return `${resolved.pathname}${resolved.search}${resolved.hash}`;
}
