// ---------------------------------------------------------------------------
// PII redaction helpers — mirror of Granit.Diagnostics.LogRedaction (.NET).
// Use these at log call-sites to keep PII out of console/OTLP transports
// (GDPR Art. 5, ISO 27001 A.5.34).
// ---------------------------------------------------------------------------

const MASK = '***';

/**
 * Redacts an email address, preserving up to 3 leading chars and the domain.
 * `"john.doe@example.com"` → `"joh***@example.com"`.
 */
export function redactEmail(email: string): string {
  const at = email.indexOf('@');
  if (at <= 0) return MASK;
  const keep = Math.min(3, at);
  return `${email.slice(0, keep)}${MASK}${email.slice(at)}`;
}

/**
 * Extracts the domain of an email. Returns a bounded, non-PII value
 * suitable as a span tag. `"john@example.com"` → `"example.com"`.
 */
export function emailDomain(email: string): string {
  const at = email.indexOf('@');
  return at >= 0 ? email.slice(at + 1) : 'unknown';
}

/**
 * Redacts a phone number, preserving the country-code prefix and the last
 * two digits. `"+33612345678"` → `"+336*****78"`.
 */
export function redactPhone(phone: string): string {
  if (phone.length <= 4) return MASK;
  const prefix = Math.min(4, phone.length - 2);
  return `${phone.slice(0, prefix)}*****${phone.slice(-2)}`;
}

/**
 * Redacts an opaque token (device token, refresh token, …) preserving a
 * short prefix and suffix for log correlation. `"dLkj3FDmAbCdEfGh"` →
 * `"dLkj...fGh"`.
 */
export function redactToken(token: string): string {
  if (token.length <= 8) return MASK;
  return `${token.slice(0, 4)}...${token.slice(-3)}`;
}

/**
 * Masks an IPv4 address to /24. IPv6 is truncated after the fourth group.
 * `"192.168.1.42"` → `"192.168.1.***"`.
 */
export function redactIpAddress(ip: string): string {
  const lastDot = ip.lastIndexOf('.');
  if (lastDot > 0) return `${ip.slice(0, lastDot + 1)}${MASK}`;
  let colons = 0;
  for (let i = 0; i < ip.length; i++) {
    if (ip[i] === ':') colons++;
    if (colons === 4) return `${ip.slice(0, i)}:${MASK}`;
  }
  return MASK;
}

/**
 * Redacts a username, preserving a 3-char prefix. `"john_admin"` → `"joh***"`.
 */
export function redactUsername(username: string): string {
  if (username.length <= 3) return MASK;
  return `${username.slice(0, 3)}${MASK}`;
}

/**
 * Short, non-reversible hash prefix (SHA-256[:4], 8 hex chars). Useful as
 * a correlation tag when full content must not be stored. Async because
 * Web Crypto's `subtle.digest` is the only built-in SHA-256 in the browser.
 */
export async function hashPrefix(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  const hex = Array.from(new Uint8Array(digest).slice(0, 4))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return hex;
}

/** Aggregate export mirroring the .NET `LogRedaction` static class shape. */
export const redact = {
  email: redactEmail,
  emailDomain,
  phone: redactPhone,
  token: redactToken,
  ipAddress: redactIpAddress,
  username: redactUsername,
  hashPrefix,
} as const;
