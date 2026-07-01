import { resetGranitPoliciesForTests, resetInstalledPoliciesForTests } from '@granit/csp/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { GRANIT_MAP_POLICY_NAME, __setSanitizerForTests, installPolicy } from '../index';

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
  __setSanitizerForTests(null);
  delete (globalThis as { trustedTypes?: unknown }).trustedTypes;
});

afterEach(() => {
  __setSanitizerForTests(null);
});

describe('granit-map installPolicy', () => {
  it('registers under "granit-map"', () => {
    const factory = withFakeTrustedTypes();
    const r = installPolicy();
    expect(r).toEqual({ status: 'installed', name: 'granit-map' });
    expect(factory.createPolicy).toHaveBeenCalledWith('granit-map', expect.any(Object));
    expect(GRANIT_MAP_POLICY_NAME).toBe('granit-map');
  });

  it('is idempotent', () => {
    const factory = withFakeTrustedTypes();
    installPolicy();
    expect(installPolicy()).toEqual({ status: 'already-installed', name: 'granit-map' });
    expect(factory.createPolicy).toHaveBeenCalledTimes(1);
  });

  it('is a no-op when Trusted Types are unavailable', () => {
    expect(installPolicy()).toEqual({ status: 'unsupported', reason: 'no-trusted-types' });
  });

  it('routes createHTML through the injected sanitizer', () => {
    const factory = withFakeTrustedTypes();
    const sanitize = vi.fn((s: string) => `SAFE(${s})`);
    __setSanitizerForTests({ sanitize });

    installPolicy();
    const opts = factory.createPolicy.mock.calls[0]![1] as TrustedTypePolicyOptions;
    const out = opts.createHTML?.('<b>foo</b>');

    expect(out).toBe('SAFE(<b>foo</b>)');
    expect(sanitize).toHaveBeenCalledWith('<b>foo</b>', { USE_PROFILES: { html: true } });
  });

  it('falls back to identity when sanitizer not yet loaded (subsequent calls sanitize)', () => {
    const factory = withFakeTrustedTypes();
    installPolicy();
    const opts = factory.createPolicy.mock.calls[0]![1] as TrustedTypePolicyOptions;
    // First call — no sanitizer wired, framework relies on escapeHtml() upstream.
    expect(opts.createHTML?.('already-escaped')).toBe('already-escaped');
  });
});
