/**
 * Extract the `returnUrl` query parameter from a URL search string.
 *
 * Used after headless login to redirect the browser to the OIDC authorization
 * endpoint (`/connect/authorize`) that the Identity Server originally intended.
 *
 * Only relative URLs (starting with `/`) are accepted — absolute URLs and
 * protocol-relative URLs (`//evil.com`) are rejected to prevent open-redirect
 * attacks.
 *
 * @param search - URL search string (e.g. `?returnUrl=%2Fconnect%2Fauthorize`).
 *                 Defaults to `globalThis.location.search`.
 * @returns The decoded return URL, or `null` if absent or unsafe.
 */
export function extractReturnUrl(search?: string): string | null {
  const params = new URLSearchParams(search ?? globalThis.location?.search ?? '');
  const returnUrl = params.get('returnUrl');
  if (!returnUrl) return null;

  // Only allow relative paths — reject absolute and protocol-relative URLs
  if (returnUrl.startsWith('/') && !returnUrl.startsWith('//')) return returnUrl;

  return null;
}
