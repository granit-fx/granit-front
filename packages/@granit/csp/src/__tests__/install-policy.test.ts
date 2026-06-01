import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { GRANIT_CORE_POLICY_NAME, installPolicy } from '../core-policy';
import { installNamedPolicy, resetInstalledPoliciesForTests } from '../install-policy';
import {
  getCspTrustedTypesDirective,
  listInstalledGranitPolicies,
  resetGranitPoliciesForTests,
} from '../registry';

import type { TrustedTypePolicyOptions } from '../types/index';

interface FakeFactory {
  createPolicy: ReturnType<typeof vi.fn>;
}

function withFakeTrustedTypes(): FakeFactory {
  const factory: FakeFactory = { createPolicy: vi.fn() };
  (globalThis as { trustedTypes?: FakeFactory }).trustedTypes = factory;
  return factory;
}

function clearTrustedTypes(): void {
  delete (globalThis as { trustedTypes?: unknown }).trustedTypes;
}

beforeEach(() => {
  resetInstalledPoliciesForTests();
  resetGranitPoliciesForTests();
  clearTrustedTypes();
});

afterEach(() => {
  clearTrustedTypes();
});

describe('installNamedPolicy', () => {
  it('returns "installed" and registers in the factory when TT is available', () => {
    const factory = withFakeTrustedTypes();
    const opts: TrustedTypePolicyOptions = { createHTML: (s) => s };

    const result = installNamedPolicy('granit', opts);

    expect(result).toEqual({ status: 'installed', name: 'granit' });
    expect(factory.createPolicy).toHaveBeenCalledWith('granit', opts);
  });

  it('is idempotent — second call returns "already-installed" and does not re-register', () => {
    const factory = withFakeTrustedTypes();

    installNamedPolicy('granit', { createHTML: (s) => s });
    const r2 = installNamedPolicy('granit', { createHTML: (s) => s });

    expect(r2).toEqual({ status: 'already-installed', name: 'granit' });
    expect(factory.createPolicy).toHaveBeenCalledTimes(1);
  });

  it('returns "unsupported / no-trusted-types" when TT is absent', () => {
    clearTrustedTypes();
    const r = installNamedPolicy('granit', { createHTML: (s) => s });
    expect(r).toEqual({ status: 'unsupported', reason: 'no-trusted-types' });
  });
});

describe('installPolicy (core "granit")', () => {
  it('registers the policy under the granit name', () => {
    const factory = withFakeTrustedTypes();
    const result = installPolicy();
    expect(result).toEqual({ status: 'installed', name: 'granit' });
    expect(factory.createPolicy).toHaveBeenCalledWith('granit', expect.any(Object));
    expect(GRANIT_CORE_POLICY_NAME).toBe('granit');
  });

  it('exposes a createHTML that always throws — the core policy is strict refuser', () => {
    const factory = withFakeTrustedTypes();
    installPolicy();
    const opts = factory.createPolicy.mock.calls[0]![1] as TrustedTypePolicyOptions;
    expect(() => opts.createHTML?.('<b>x</b>')).toThrow(/refuses HTML/);
  });

  it('exposes a createScript that always throws', () => {
    const factory = withFakeTrustedTypes();
    installPolicy();
    const opts = factory.createPolicy.mock.calls[0]![1] as TrustedTypePolicyOptions;
    expect(() => opts.createScript?.('x()')).toThrow(/eval-equivalent/);
  });

  it('exposes a createScriptURL that always throws', () => {
    const factory = withFakeTrustedTypes();
    installPolicy();
    const opts = factory.createPolicy.mock.calls[0]![1] as TrustedTypePolicyOptions;
    expect(() => opts.createScriptURL?.('/x.js')).toThrow(/refuses script URLs/);
  });
});

describe('registry', () => {
  it('lists installed policies in insertion order', () => {
    withFakeTrustedTypes();

    installNamedPolicy('granit', {});
    installNamedPolicy('granit-map', {});
    installNamedPolicy('granit-keycloak', {});

    expect(listInstalledGranitPolicies()).toEqual(['granit', 'granit-map', 'granit-keycloak']);
  });

  it('builds the trusted-types directive value', () => {
    withFakeTrustedTypes();
    installNamedPolicy('granit', {});
    installNamedPolicy('granit-map', {});
    expect(getCspTrustedTypesDirective()).toBe('granit granit-map');
  });

  it("returns 'none' when no policy is installed (CSP locks everything)", () => {
    expect(getCspTrustedTypesDirective()).toBe("'none'");
  });
});
