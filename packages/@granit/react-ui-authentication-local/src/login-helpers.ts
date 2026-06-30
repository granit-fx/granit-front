import { isAxiosError } from '@granit/react-authentication-local';

import { logger } from './logger';
import { safeReturnUrl } from './safe-return-url';

const log = logger.child('HeadlessLogin');

export function fromBase64Url(base64url: string): Uint8Array<ArrayBuffer> {
  const base64 = base64url.replaceAll('-', '+').replaceAll('_', '/');
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
  // `Uint8Array.from` returns `Uint8Array<ArrayBufferLike>` in TS 5.x; wrapping
  // with `new Uint8Array()` allocates a fresh ArrayBuffer and gives the correct
  // `Uint8Array<ArrayBuffer>` type required by BufferSource / WebAuthn APIs.
  return new Uint8Array(Uint8Array.from(atob(padded), (c) => c.codePointAt(0) ?? 0));
}

export function toBase64Url(buffer: ArrayBuffer): string {
  // base64 padding is only ever trailing '=', so strip all of them — avoids a
  // backtracking-prone `/=+$/` regex (SonarQube super-linear runtime warning).
  return btoa(String.fromCodePoint(...new Uint8Array(buffer)))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '');
}

export function redirectTo(url: string): void {
  globalThis.location.href = url;
}

export function redirectToReturnUrl(): void {
  const params = new URLSearchParams(globalThis.location.search);
  redirectTo(safeReturnUrl(params.get('returnUrl'), '/'));
}

export function serializeCredential(credential: PublicKeyCredential): string {
  const response = credential.response as AuthenticatorAssertionResponse;
  return JSON.stringify({
    id: credential.id,
    rawId: toBase64Url(credential.rawId),
    type: credential.type,
    response: {
      authenticatorData: toBase64Url(response.authenticatorData),
      clientDataJSON: toBase64Url(response.clientDataJSON),
      signature: toBase64Url(response.signature),
      userHandle: response.userHandle ? toBase64Url(response.userHandle) : null,
    },
  });
}

export function handleLoginError(
  err: unknown,
  setError: (msg: string) => void,
  t: (key: string) => string
): void {
  if (isAxiosError(err)) {
    const status = err.response?.status;
    if (status === 401) {
      setError(t('Auth.HeadlessLogin.InvalidCredentials'));
    } else {
      setError(t('Auth.HeadlessLogin.UnexpectedError'));
    }
  } else {
    setError(t('Auth.HeadlessLogin.UnexpectedError'));
  }
  log.error('Login failed', err);
}
