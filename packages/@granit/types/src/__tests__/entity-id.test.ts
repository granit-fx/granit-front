import { describe, expect, expectTypeOf, it } from 'vitest';

import { toEntityId } from '../entity-id';

import type { EntityId, TenantId, UserId } from '../entity-id';

describe('EntityId', () => {
  it('toEntityId returns the same string value', () => {
    const raw = '550e8400-e29b-41d4-a716-446655440000';
    const branded = toEntityId<'User'>(raw);

    expect(branded).toBe(raw);
  });

  it('branded value is assignable to string', () => {
    const branded: UserId = toEntityId<'User'>('user-123');
    const plain: string = branded;

    expect(plain).toBe('user-123');
  });

  it('supports string operations', () => {
    const branded = toEntityId<'Tenant'>('tenant-abc');

    expect(branded.startsWith('tenant')).toBe(true);
    expect(branded.length).toBeGreaterThan(0);
  });

  it('UserId and TenantId are distinct types', () => {
    const userId = toEntityId<'User'>('same-value');
    const tenantId = toEntityId<'Tenant'>('same-value');

    expect(userId).toBe(tenantId);

    expectTypeOf(userId).toMatchTypeOf<UserId>();
    expectTypeOf(tenantId).toMatchTypeOf<TenantId>();
    expectTypeOf(userId).not.toMatchTypeOf<TenantId>();
    expectTypeOf(tenantId).not.toMatchTypeOf<UserId>();
  });

  it('same brand is structurally compatible across definitions', () => {
    type InvoiceIdA = EntityId<'Invoice'>;
    type InvoiceIdB = EntityId<'Invoice'>;

    const id = toEntityId<'Invoice'>('inv-001');

    expectTypeOf(id).toMatchTypeOf<InvoiceIdA>();
    expectTypeOf(id).toMatchTypeOf<InvoiceIdB>();
  });
});
