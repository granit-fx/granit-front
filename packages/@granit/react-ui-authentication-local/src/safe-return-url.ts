/**
 * Validate a `returnUrl` query parameter before passing it to
 * `window.location.href`. Rejects absolute URLs, protocol-relative
 * URLs (`//evil.tld`), and non-http(s) schemes (`javascript:`, `data:`)
 * to prevent open-redirect phishing (CWE-601).
 *
 * Only same-origin relative paths starting with a single `/` are accepted.
 */
export function safeReturnUrl(raw: string | null, fallback = '/login'): string {
  if (!raw) return fallback;
  if (!raw.startsWith('/')) return fallback;
  if (raw.startsWith('//')) return fallback;
  if (raw.startsWith('/\\')) return fallback;
  return raw;
}
