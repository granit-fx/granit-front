// ---------------------------------------------------------------------------
// Default PII scrubber applied on outgoing OTLP log payloads.
// Defense-in-depth: catches PII that leaks through `err.response.data`,
// `err.config.url`, Axios stack traces, etc. — payloads that call-site
// helpers cannot reach.
// ---------------------------------------------------------------------------

const EMAIL_RE = /(?<local>[A-Za-z0-9._%+-]{1,64})@(?<domain>[A-Za-z0-9.-]+\.[A-Za-z]{2,})/g;

// `Authorization: Bearer xxx` and variants (token chars; `i` flag covers a-z).
const BEARER_RE = /(Bearer\s+)([A-Z0-9._-]{8,})/gi;

// Raw JWT (three base64url segments separated by dots, header starts with eyJ)
const JWT_RE = /\beyJ[A-Za-z0-9_-]{4,}\.[A-Za-z0-9_-]{4,}\.[A-Za-z0-9_-]{4,}\b/g;

// IBAN (rough): 2 letters + 2 digits + 11-30 alphanumerics
const IBAN_RE = /\b[A-Z]{2}\d{2}[A-Z0-9]{11,30}\b/g;

// Credit card-ish: 13-19 digits, optionally grouped by spaces or dashes
const CREDIT_CARD_RE = /\b(?:\d[ -]*?){13,19}\b/g;

// Phone in E.164 (+ followed by 8-15 digits)
const PHONE_E164_RE = /\+\d{8,15}\b/g;

function maskEmail(_match: string, local: string, domain: string): string {
  const keep = Math.min(3, local.length);
  return `${local.slice(0, keep)}***@${domain}`;
}

function maskBearer(_match: string, prefix: string, token: string): string {
  if (token.length <= 8) return `${prefix}***`;
  return `${prefix}${token.slice(0, 4)}...${token.slice(-3)}`;
}

function maskToken(token: string): string {
  if (token.length <= 8) return '***';
  return `${token.slice(0, 4)}...${token.slice(-3)}`;
}

function passesLuhn(digits: string): boolean {
  let sum = 0;
  let alt = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    const c = digits.codePointAt(i);
    if (c === undefined || c < 48 || c > 57) return false;
    let n = c - 48;
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}

function maskCreditCard(match: string): string {
  const digits = match.replace(/[^\d]/g, '');
  if (digits.length < 13 || digits.length > 19) return match;
  // Only mask when Luhn-valid to limit false positives on long numeric IDs.
  if (!passesLuhn(digits)) return match;
  return `***${digits.slice(-4)}`;
}

/**
 * Apply built-in PII patterns to a text. Returns the input unchanged when
 * no pattern matches. Designed to be cheap enough to run on every log
 * attribute server-side / transport-side.
 */
export function defaultPiiRedactor(input: string): string {
  if (!input) return input;
  let out = input;
  // Order matters: redact JWT/Bearer before email (a JWT can contain '@'
  // inside its base64-decoded payload, but the raw form does not match
  // EMAIL_RE so this is more about keeping `Bearer eyJ…` clean as a unit).
  out = out.replace(BEARER_RE, maskBearer);
  out = out.replace(JWT_RE, (m) => maskToken(m));
  out = out.replace(EMAIL_RE, maskEmail);
  out = out.replace(IBAN_RE, (m) => `${m.slice(0, 4)}***`);
  out = out.replace(CREDIT_CARD_RE, maskCreditCard);
  out = out.replace(PHONE_E164_RE, (m) =>
    m.length <= 4 ? '***' : `${m.slice(0, Math.min(4, m.length - 2))}*****${m.slice(-2)}`
  );
  return out;
}
