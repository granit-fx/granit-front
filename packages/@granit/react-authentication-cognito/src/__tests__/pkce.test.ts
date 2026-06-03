import { afterEach, describe, expect, it } from 'vitest';

import {
  COGNITO_AUTH_TX_KEY,
  buildCognitoAuthorizeUrl,
  clearCognitoAuthTransaction,
  generatePkce,
  persistCognitoAuthTransaction,
  randomToken,
  readCognitoAuthTransaction,
} from '../pkce';

const BASE64URL = /^[A-Za-z0-9_-]+$/u;

describe('randomToken', () => {
  it('returns an unpadded base64url string with >= 256 bits of entropy', () => {
    const token = randomToken();
    expect(token).toMatch(BASE64URL);
    expect(token).not.toContain('=');
    expect(token.length).toBeGreaterThanOrEqual(43); // 32 bytes → 43 base64url chars
  });

  it('is unique per call', () => {
    expect(randomToken()).not.toBe(randomToken());
  });
});

describe('generatePkce', () => {
  it('derives a base64url S256 challenge from the verifier', async () => {
    const { verifier, challenge } = await generatePkce();
    expect(verifier).toMatch(BASE64URL);
    expect(challenge).toMatch(BASE64URL);
    expect(challenge).not.toBe(verifier);
  });

  it('challenge equals base64url(SHA-256(verifier)) (S256)', async () => {
    const { verifier, challenge } = await generatePkce();
    const digest = await globalThis.crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(verifier)
    );
    let binary = '';
    for (const byte of new Uint8Array(digest)) binary += String.fromCharCode(byte);
    const expected = btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/u, '');
    expect(challenge).toBe(expected);
  });
});

describe('authorization transaction persistence', () => {
  afterEach(() => globalThis.sessionStorage.clear());

  it('round-trips verifier/state/nonce via sessionStorage', () => {
    persistCognitoAuthTransaction({ verifier: 'v', state: 's', nonce: 'n' });
    expect(readCognitoAuthTransaction()).toEqual({ verifier: 'v', state: 's', nonce: 'n' });
  });

  it('returns null when absent', () => {
    expect(readCognitoAuthTransaction()).toBeNull();
  });

  it('returns null on malformed JSON', () => {
    globalThis.sessionStorage.setItem(COGNITO_AUTH_TX_KEY, '{not json');
    expect(readCognitoAuthTransaction()).toBeNull();
  });

  it('returns null on a partial transaction', () => {
    globalThis.sessionStorage.setItem(COGNITO_AUTH_TX_KEY, JSON.stringify({ verifier: 'v' }));
    expect(readCognitoAuthTransaction()).toBeNull();
  });

  it('clear removes the stored transaction (single-use)', () => {
    persistCognitoAuthTransaction({ verifier: 'v', state: 's', nonce: 'n' });
    clearCognitoAuthTransaction();
    expect(readCognitoAuthTransaction()).toBeNull();
  });
});

describe('buildCognitoAuthorizeUrl', () => {
  it('builds an S256 PKCE authorize URL with every parameter encoded (VULN-301)', () => {
    const url = buildCognitoAuthorizeUrl({
      domain: 'auth.example.com',
      clientId: 'client 1', // space must be encoded, not concatenated raw
      redirectUri: 'https://app.example/cb',
      scopes: ['openid', 'profile'],
      challenge: 'CHAL',
      state: 'STATE',
      nonce: 'NONCE',
    });
    const parsed = new URL(url);
    expect(parsed.origin + parsed.pathname).toBe('https://auth.example.com/login');
    expect(parsed.searchParams.get('client_id')).toBe('client 1');
    expect(parsed.searchParams.get('response_type')).toBe('code');
    expect(parsed.searchParams.get('scope')).toBe('openid profile');
    expect(parsed.searchParams.get('redirect_uri')).toBe('https://app.example/cb');
    expect(parsed.searchParams.get('code_challenge')).toBe('CHAL');
    expect(parsed.searchParams.get('code_challenge_method')).toBe('S256');
    expect(parsed.searchParams.get('state')).toBe('STATE');
    expect(parsed.searchParams.get('nonce')).toBe('NONCE');
    // Raw serialization must encode the space rather than emit it literally.
    expect(url).toContain('client_id=client+1');
  });
});
