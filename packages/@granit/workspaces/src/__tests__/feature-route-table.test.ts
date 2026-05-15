import { describe, expect, it } from 'vitest';

import {
  InvalidFeatureNameError,
  resolveFeatureRoute,
  type FeatureRouteTable,
} from '../routes/feature-route-table.js';

const table: FeatureRouteTable = {
  'identity.users.list': { path: '/users' },
  'invoicing.invoices.list': { path: '/invoicing' },
  'parties.parties.list': { path: '/crm/parties' },
};

describe('resolveFeatureRoute', () => {
  it('returns the spec when the feature is registered', () => {
    expect(resolveFeatureRoute(table, 'invoicing.invoices.list')).toEqual({
      path: '/invoicing',
    });
  });

  it('returns null when the feature is not registered', () => {
    expect(resolveFeatureRoute(table, 'unknown.feature.name')).toBeNull();
  });

  it('does not fall back across feature names — exact match only', () => {
    expect(resolveFeatureRoute(table, 'invoicing.invoices')).toBeNull();
  });

  it('returns null on an empty registry', () => {
    expect(resolveFeatureRoute({}, 'invoicing.invoices.list')).toBeNull();
  });

  it('throws InvalidFeatureNameError on an empty name', () => {
    expect(() => resolveFeatureRoute(table, '')).toThrow(InvalidFeatureNameError);
  });

  it('throws InvalidFeatureNameError on a whitespace-only name', () => {
    expect(() => resolveFeatureRoute(table, '   ')).toThrow(InvalidFeatureNameError);
  });
});
