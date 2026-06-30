// ---------------------------------------------------------------------------
// PKCE (RFC 7636) + anti-forgery helpers for the Cognito Hosted-UI code flow.
//
// A public SPA client must use PKCE with S256 (RFC 9700 §2.1.1): the
// authorization `code` is bound to a one-time `code_verifier` so an
// intercepted code cannot be redeemed. `state` defends the authorization
// response against CSRF / code-injection; `nonce` binds the resulting
// id_token to this login attempt. All three are persisted in sessionStorage
// for the redirect round-trip and consumed once on the callback.
// ---------------------------------------------------------------------------

/** sessionStorage key holding the in-flight authorization transaction. */
export const COGNITO_AUTH_TX_KEY = 'granit.cognito.authtx';

/** 256 bits of entropy → a 43-char base64url verifier (RFC 7636 §4.1). */
const TOKEN_BYTES = 32;

/** base64url-encode without padding (RFC 7636 Appendix A). */
function base64UrlEncode(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCodePoint(byte);
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}

/** Cryptographically-random URL-safe token (verifier, `state`, `nonce`). */
export function randomToken(byteLength: number = TOKEN_BYTES): string {
  const buffer = new Uint8Array(byteLength);
  globalThis.crypto.getRandomValues(buffer);
  return base64UrlEncode(buffer);
}

export interface PkcePair {
  /** High-entropy secret kept in the browser and sent at token exchange. */
  readonly verifier: string;
  /** `S256(verifier)` sent on the authorization request. */
  readonly challenge: string;
}

/** Generate a PKCE verifier + its S256 challenge (RFC 7636). */
export async function generatePkce(): Promise<PkcePair> {
  const verifier = randomToken();
  const digest = await globalThis.crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(verifier)
  );
  return { verifier, challenge: base64UrlEncode(new Uint8Array(digest)) };
}

/** One-time authorization transaction stored across the IdP redirect. */
export interface CognitoAuthTransaction {
  readonly verifier: string;
  readonly state: string;
  readonly nonce: string;
}

/** Persist the transaction for the redirect round-trip (sessionStorage). */
export function persistCognitoAuthTransaction(tx: CognitoAuthTransaction): void {
  globalThis.sessionStorage?.setItem(COGNITO_AUTH_TX_KEY, JSON.stringify(tx));
}

/**
 * Read the in-flight authorization transaction (or `null`). Call on the
 * callback to validate the returned `state` and obtain the `code_verifier`
 * for the token exchange, then call {@link clearCognitoAuthTransaction}.
 */
export function readCognitoAuthTransaction(): CognitoAuthTransaction | null {
  const raw = globalThis.sessionStorage?.getItem(COGNITO_AUTH_TX_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<CognitoAuthTransaction>;
    if (
      typeof parsed.verifier === 'string' &&
      typeof parsed.state === 'string' &&
      typeof parsed.nonce === 'string'
    ) {
      return { verifier: parsed.verifier, state: parsed.state, nonce: parsed.nonce };
    }
    return null;
  } catch {
    return null;
  }
}

/** Remove the stored transaction (single-use). */
export function clearCognitoAuthTransaction(): void {
  globalThis.sessionStorage?.removeItem(COGNITO_AUTH_TX_KEY);
}

/**
 * Build the Cognito Hosted-UI authorization URL with PKCE (S256), `state` and
 * `nonce`. All parameters are properly URL-encoded via `URLSearchParams`
 * (closes the prior unencoded string concatenation, VULN-301).
 */
export function buildCognitoAuthorizeUrl(params: {
  readonly domain: string;
  readonly clientId: string;
  readonly redirectUri: string;
  readonly scopes: readonly string[];
  readonly challenge: string;
  readonly state: string;
  readonly nonce: string;
  /** Forwarded as `ui_locales` to render the Hosted UI in the active locale. */
  readonly locale?: string;
  /** Forwarded as `login_hint` to pre-fill the username/email field. */
  readonly loginHint?: string;
}): string {
  const url = new URL(`https://${params.domain}/login`);
  url.searchParams.set('client_id', params.clientId);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', params.scopes.join(' '));
  url.searchParams.set('redirect_uri', params.redirectUri);
  url.searchParams.set('code_challenge', params.challenge);
  url.searchParams.set('code_challenge_method', 'S256');
  url.searchParams.set('state', params.state);
  url.searchParams.set('nonce', params.nonce);
  if (params.locale) url.searchParams.set('ui_locales', params.locale);
  if (params.loginHint) url.searchParams.set('login_hint', params.loginHint);
  return url.toString();
}
