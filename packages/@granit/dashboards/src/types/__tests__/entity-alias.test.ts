import { describe, expect, it } from 'vitest';

import {
  isRouteParamResolver,
  isStaticEntityResolver,
  isTenantContextResolver,
  isUserSelectionResolver,
  isViewEntityResolver,
} from '../entity-alias.js';

import type { EntityAlias, EntityAliasResolver } from '../entity-alias.js';

describe('EntityAliasResolver discriminator narrowing', () => {
  const route: EntityAliasResolver = { kind: 'route-param', paramName: 'customerId' };
  const view: EntityAliasResolver = { kind: 'view-entity', paramName: 'entityId' };
  const tenant: EntityAliasResolver = { kind: 'tenant-context' };
  const user: EntityAliasResolver = { kind: 'user-selection', lookupName: 'Customers' };
  const stat: EntityAliasResolver = { kind: 'static', entityId: '8c6b1e10-0000' };

  it('routes route-param through isRouteParamResolver', () => {
    expect(isRouteParamResolver(route)).toBe(true);
    for (const other of [view, tenant, user, stat]) {
      expect(isRouteParamResolver(other)).toBe(false);
    }
  });

  it('routes view-entity through isViewEntityResolver', () => {
    expect(isViewEntityResolver(view)).toBe(true);
  });

  it('routes tenant-context through isTenantContextResolver', () => {
    expect(isTenantContextResolver(tenant)).toBe(true);
  });

  it('routes user-selection through isUserSelectionResolver', () => {
    expect(isUserSelectionResolver(user)).toBe(true);
  });

  it('routes static through isStaticEntityResolver', () => {
    expect(isStaticEntityResolver(stat)).toBe(true);
  });
});

describe('EntityAlias — wire shape', () => {
  it('round-trips through JSON without mutation', () => {
    const alias: EntityAlias = {
      name: 'currentCustomer',
      entityType: 'Customer',
      resolver: { kind: 'route-param', paramName: 'customerId' },
    };
    expect(JSON.parse(JSON.stringify(alias))).toEqual(alias);
  });
});
