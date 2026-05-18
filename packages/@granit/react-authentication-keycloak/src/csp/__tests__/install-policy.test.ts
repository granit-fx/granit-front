import { resetGranitPoliciesForTests, resetInstalledPoliciesForTests } from '@granit/csp/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  GRANIT_KEYCLOAK_POLICY_NAME,
  installPolicy,
  setKeycloakAuthorities,
} from '../index.js';

import type { TrustedTypePolicyOptions } from '@granit/csp';

interface FakeFactory {
  createPolicy: ReturnType<typeof vi.fn>;
}

function withFakeTrustedTypes(): FakeFactory {
  const factory: FakeFactory = { createPolicy: vi.fn() };
  (globalThis as { trustedTypes?: FakeFactory }).trustedTypes = factory;
  return factory;
}

beforeEach(() => {
  resetInstalledPoliciesForTests();
  resetGranitPoliciesForTests();
  setKeycloakAuthorities([]);
  delete (globalThis as { trustedTypes?: unknown }).trustedTypes;
});

afterEach(() => {
  setKeycloakAuthorities([]);
});

describe('granit-keycloak installPolicy', () => {
  it('registers under "granit-keycloak"', () => {
    const factory = withFakeTrustedTypes();
    const r = installPolicy();
    expect(r).toEqual({ status: 'installed', name: 'granit-keycloak' });
    expect(factory.createPolicy).toHaveBeenCalledWith('granit-keycloak', expect.any(Object));
    expect(GRANIT_KEYCLOAK_POLICY_NAME).toBe('granit-keycloak');
  });

  it('is idempotent', () => {
    const factory = withFakeTrustedTypes();
    installPolicy();
    expect(installPolicy()).toEqual({ status: 'already-installed', name: 'granit-keycloak' });
    expect(factory.createPolicy).toHaveBeenCalledTimes(1);
  });

  it('is a no-op when Trusted Types are unavailable', () => {
    expect(installPolicy()).toEqual({ status: 'unsupported', reason: 'no-trusted-types' });
  });
});

describe('granit-keycloak createScriptURL', () => {
  function getCreateScriptURL(): (input: string) => string {
    const factory = withFakeTrustedTypes();
    installPolicy();
    const opts = factory.createPolicy.mock.calls[0]![1] as TrustedTypePolicyOptions;
    return opts.createScriptURL!;
  }

  it('accepts a same-origin relative URL', () => {
    setKeycloakAuthorities(['https://idp.example.com/realms/my']);
    expect(getCreateScriptURL()('/silent-check-sso.html')).toBe('/silent-check-sso.html');
  });

  it('accepts a URL whose origin matches the registered authority', () => {
    setKeycloakAuthorities(['https://idp.example.com/realms/my']);
    const out = getCreateScriptURL()('https://idp.example.com/realms/my/protocol/openid-connect/auth');
    expect(out).toContain('idp.example.com');
  });

  it('rejects a URL whose origin is not in the allow-list', () => {
    setKeycloakAuthorities(['https://idp.example.com/realms/my']);
    expect(() => getCreateScriptURL()('https://evil.example.org/login')).toThrow(/not in the registered/);
  });

  it('rejects javascript: scheme', () => {
    setKeycloakAuthorities(['https://idp.example.com']);
    expect(() => getCreateScriptURL()('javascript:alert(1)')).toThrow(/Refused script URL scheme/);
  });

  it('rejects protocol-relative URL (would inherit page scheme)', () => {
    setKeycloakAuthorities(['https://idp.example.com']);
    expect(() => getCreateScriptURL()('//evil.example.org/login')).toThrow();
  });

  it('throws when no authority is registered', () => {
    setKeycloakAuthorities([]);
    expect(() => getCreateScriptURL()('https://idp.example.com/realms/my')).toThrow(
      /No Keycloak authority registered/
    );
  });

  it('setKeycloakAuthorities rejects a malformed URL', () => {
    expect(() => setKeycloakAuthorities(['not a url'])).toThrow(/Invalid authority/);
  });
});
