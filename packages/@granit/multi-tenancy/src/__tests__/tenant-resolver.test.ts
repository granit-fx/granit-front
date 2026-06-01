import { describe, expect, it } from 'vitest';

import { resolveTenant } from '../resolvers/tenant-resolver';

import type { TenantResolver } from '../resolvers/tenant-resolver';

describe('resolveTenant', () => {
  it('returns the result of the first resolver that matches', () => {
    const resolvers: TenantResolver[] = [
      { order: 200, name: 'second', resolve: () => ({ id: 'tenant-b' }) },
      { order: 100, name: 'first', resolve: () => ({ id: 'tenant-a' }) },
    ];

    const result = resolveTenant(resolvers);

    expect(result).toEqual({ id: 'tenant-a' });
  });

  it('skips resolvers that return null', () => {
    const resolvers: TenantResolver[] = [
      { order: 100, name: 'empty', resolve: () => null },
      { order: 200, name: 'found', resolve: () => ({ id: 'tenant-b', name: 'Acme' }) },
    ];

    const result = resolveTenant(resolvers);

    expect(result).toEqual({ id: 'tenant-b', name: 'Acme' });
  });

  it('returns null when no resolver matches', () => {
    const resolvers: TenantResolver[] = [
      { order: 100, name: 'a', resolve: () => null },
      { order: 200, name: 'b', resolve: () => null },
    ];

    expect(resolveTenant(resolvers)).toBeNull();
  });

  it('returns null for an empty resolver list', () => {
    expect(resolveTenant([])).toBeNull();
  });

  it('does not mutate the original resolvers array', () => {
    const resolvers: TenantResolver[] = [
      { order: 300, name: 'c', resolve: () => ({ id: '3' }) },
      { order: 100, name: 'a', resolve: () => ({ id: '1' }) },
      { order: 200, name: 'b', resolve: () => ({ id: '2' }) },
    ];

    resolveTenant(resolvers);

    expect(resolvers.map((r) => r.order)).toEqual([300, 100, 200]);
  });
});
