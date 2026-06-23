import { describe, expect, it } from 'vitest';

import { recapParentRefs } from '../bulk-recap';

import type { EntitySelectionBarRecap } from '@granit/react-entities';

const baseRecap: Omit<EntitySelectionBarRecap, 'parents'> = {
  succeeded: ['p-1', 'p-2'],
  failed: [],
};

describe('recapParentRefs', () => {
  it('returns empty array when parents is undefined (per-row fan-out path)', () => {
    expect(recapParentRefs({ ...baseRecap })).toEqual([]);
  });

  it('returns empty array when parents is an empty list', () => {
    expect(recapParentRefs({ ...baseRecap, parents: [] })).toEqual([]);
  });

  it('parses well-formed parent markers into entity refs', () => {
    const refs = recapParentRefs({
      ...baseRecap,
      parents: ['Granit.MultiTenancy.Tenant:tenant-1', 'Granit.Parties.Party:p-42'],
    });
    expect(refs).toEqual([
      { entityName: 'Granit.MultiTenancy.Tenant', entityId: 'tenant-1' },
      { entityName: 'Granit.Parties.Party', entityId: 'p-42' },
    ]);
  });

  it('drops malformed markers without throwing', () => {
    const refs = recapParentRefs({
      ...baseRecap,
      parents: ['Granit.Parties.Party:p-1', 'no-colon-marker', '', 'Granit.X:p-2'],
    });
    // Order preserved for the well-formed entries.
    expect(refs).toEqual([
      { entityName: 'Granit.Parties.Party', entityId: 'p-1' },
      { entityName: 'Granit.X', entityId: 'p-2' },
    ]);
  });
});
