import { describe, expect, it } from 'vitest';

import { findMissingScopeKey, isScopeSatisfied } from '../api/scope-validation.js';

import type { LookupDescriptor } from '../types/index.js';

describe('findMissingScopeKey', () => {
  it('returns null when descriptor has no scopeKeys', () => {
    const descriptor: LookupDescriptor = { name: 'tenants' };

    expect(findMissingScopeKey(descriptor, undefined)).toBeNull();
    expect(findMissingScopeKey(descriptor, {})).toBeNull();
  });

  it('returns the first missing key when scope is undefined', () => {
    const descriptor: LookupDescriptor = { name: 'meters', scopeKeys: ['tenantId', 'orgId'] };

    expect(findMissingScopeKey(descriptor, undefined)).toBe('tenantId');
  });

  it('returns the missing key when one value is null / undefined / empty', () => {
    const descriptor: LookupDescriptor = { name: 'meters', scopeKeys: ['tenantId'] };

    expect(findMissingScopeKey(descriptor, { tenantId: null })).toBe('tenantId');
    expect(findMissingScopeKey(descriptor, { tenantId: undefined })).toBe('tenantId');
    expect(findMissingScopeKey(descriptor, { tenantId: '' })).toBe('tenantId');
  });

  it('returns null when every scope key is satisfied', () => {
    const descriptor: LookupDescriptor = { name: 'meters', scopeKeys: ['tenantId', 'orgId'] };

    expect(findMissingScopeKey(descriptor, { tenantId: 'a', orgId: 'b' })).toBeNull();
  });
});

describe('isScopeSatisfied', () => {
  it('is true when descriptor has no scopeKeys', () => {
    expect(isScopeSatisfied({ name: 'tenants' }, undefined)).toBe(true);
  });

  it('is false when any declared scope key is missing', () => {
    expect(isScopeSatisfied({ name: 'meters', scopeKeys: ['tenantId'] }, { tenantId: '' })).toBe(
      false
    );
  });

  it('is true when every declared scope key is provided', () => {
    expect(
      isScopeSatisfied({ name: 'meters', scopeKeys: ['tenantId'] }, { tenantId: 'acme' })
    ).toBe(true);
  });
});
