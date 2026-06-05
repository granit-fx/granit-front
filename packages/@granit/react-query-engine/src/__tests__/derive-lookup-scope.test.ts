import { describe, expect, it } from 'vitest';

import { deriveLookupScope } from '../utils/derive-lookup-scope';

import type { FilterEntry } from '@granit/query-engine';

const filters: readonly FilterEntry[] = [
  { field: 'TenantId', operator: 'Eq', value: 'acme' },
  { field: 'Status', operator: 'In', value: 'Active,Pending' },
];

describe('deriveLookupScope', () => {
  it('returns an empty object when there are no scope keys', () => {
    expect(deriveLookupScope(undefined, filters)).toEqual({});
    expect(deriveLookupScope([], filters)).toEqual({});
  });

  it('resolves a scope key from a matching Eq filter, case-insensitively', () => {
    expect(deriveLookupScope(['tenantId'], filters)).toEqual({ tenantId: 'acme' });
  });

  it('maps an unsatisfied scope key to undefined (Empty Scope Trap upstream)', () => {
    expect(deriveLookupScope(['regionId'], filters)).toEqual({ regionId: undefined });
  });

  it('ignores non-Eq filters when resolving scope values', () => {
    // `Status` only has an `In` filter — not a valid single-value scope source.
    expect(deriveLookupScope(['status'], filters)).toEqual({ status: undefined });
  });
});
