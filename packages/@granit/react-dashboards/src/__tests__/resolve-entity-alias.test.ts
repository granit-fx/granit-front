import { describe, expect, it } from 'vitest';

import {
  resolveDashboardAliases,
  resolveEntityAlias,
  resolveEntityAliasResolver,
} from '../lib/resolve-entity-alias';

import type { EntityAlias } from '@granit/dashboards';

const customerAlias: EntityAlias = {
  name: 'currentCustomer',
  entityType: 'Customer',
  resolver: { kind: 'route-param', paramName: 'customerId' },
};

const tenantAlias: EntityAlias = {
  name: 'currentTenant',
  entityType: 'Tenant',
  resolver: { kind: 'tenant-context' },
};

const staticAlias: EntityAlias = {
  name: 'globalEntity',
  entityType: 'Customer',
  resolver: { kind: 'static', entityId: 'global-1' },
};

const viewAlias: EntityAlias = {
  name: 'selectedDevice',
  entityType: 'Device',
  resolver: { kind: 'view-entity', paramName: 'entityId' },
};

const userSelectionAlias: EntityAlias = {
  name: 'pickedCustomer',
  entityType: 'Customer',
  resolver: { kind: 'user-selection', lookupName: 'Customers' },
};

describe('resolveEntityAliasResolver', () => {
  it('resolves static resolvers from the resolver itself (no context needed)', () => {
    expect(resolveEntityAliasResolver({ kind: 'static', entityId: 'x-42' }, {})).toBe('x-42');
  });

  it('resolves tenant-context from currentTenantId', () => {
    expect(resolveEntityAliasResolver({ kind: 'tenant-context' }, { currentTenantId: 't-7' })).toBe(
      't-7'
    );
  });

  it('returns null when tenant-context is requested but no tenant is in context', () => {
    expect(resolveEntityAliasResolver({ kind: 'tenant-context' }, {})).toBeNull();
  });

  it('resolves route-param from routeParams', () => {
    const value = resolveEntityAliasResolver(
      { kind: 'route-param', paramName: 'customerId' },
      { routeParams: { customerId: '42' } }
    );
    expect(value).toBe('42');
  });

  it('returns null when route-param is requested but the param is missing', () => {
    expect(
      resolveEntityAliasResolver({ kind: 'route-param', paramName: 'customerId' }, {})
    ).toBeNull();
    expect(
      resolveEntityAliasResolver(
        { kind: 'route-param', paramName: 'customerId' },
        { routeParams: { otherParam: 'x' } }
      )
    ).toBeNull();
  });

  it('resolves view-entity from viewParams', () => {
    expect(
      resolveEntityAliasResolver(
        { kind: 'view-entity', paramName: 'entityId' },
        { viewParams: { entityId: 'd-99' } }
      )
    ).toBe('d-99');
  });

  it('resolves user-selection from userSelections keyed by alias name', () => {
    expect(
      resolveEntityAliasResolver(
        { kind: 'user-selection', lookupName: 'Customers' },
        { userSelections: { pickedCustomer: 'c-7' } },
        'pickedCustomer'
      )
    ).toBe('c-7');
  });

  it('returns null when user-selection is requested without an alias name (no lookup possible)', () => {
    expect(
      resolveEntityAliasResolver(
        { kind: 'user-selection', lookupName: 'Customers' },
        { userSelections: { pickedCustomer: 'c-7' } }
      )
    ).toBeNull();
  });
});

describe('resolveEntityAlias — convenience wrapper threading the alias name', () => {
  it('resolves user-selection by alias name', () => {
    expect(
      resolveEntityAlias(userSelectionAlias, { userSelections: { pickedCustomer: 'c-7' } })
    ).toBe('c-7');
  });

  it('resolves route-param against the alias resolver', () => {
    expect(resolveEntityAlias(customerAlias, { routeParams: { customerId: '42' } })).toBe('42');
  });
});

describe('resolveDashboardAliases', () => {
  it('returns an empty map when aliases is null / undefined', () => {
    expect(resolveDashboardAliases(null, {})).toEqual({});
    expect(resolveDashboardAliases(undefined, {})).toEqual({});
  });

  it('resolves every alias in one pass against a shared context', () => {
    const aliases = [customerAlias, tenantAlias, staticAlias];
    const result = resolveDashboardAliases(aliases, {
      routeParams: { customerId: '42' },
      currentTenantId: 't-7',
    });
    expect(result).toEqual({
      currentCustomer: '42',
      currentTenant: 't-7',
      globalEntity: 'global-1',
    });
  });

  it('drops aliases that fail to resolve from the result map', () => {
    const aliases = [customerAlias, tenantAlias];
    const result = resolveDashboardAliases(aliases, {});
    expect(result).toEqual({});
  });

  it("handles a mixed pass where some resolve and some don't", () => {
    const aliases = [customerAlias, viewAlias, userSelectionAlias];
    const result = resolveDashboardAliases(aliases, {
      routeParams: { customerId: '42' },
      // viewParams missing → viewAlias drops
      userSelections: { pickedCustomer: 'c-7' },
    });
    expect(result).toEqual({
      currentCustomer: '42',
      pickedCustomer: 'c-7',
    });
  });
});
