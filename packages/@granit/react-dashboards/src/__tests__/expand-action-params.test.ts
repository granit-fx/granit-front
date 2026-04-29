import { describe, expect, it } from 'vitest';

import {
  expandActionParams,
  expandActionPlaceholders,
  expandActionTargetAndParams,
} from '../lib/expand-action-params.js';

describe('expandActionPlaceholders', () => {
  it('substitutes ${row.field} placeholders from the dispatch row', () => {
    expect(
      expandActionPlaceholders('/customers/${row.customerId}', {
        row: { customerId: '42' },
      })
    ).toBe('/customers/42');
  });

  it('substitutes ${aliasName} placeholders from the alias map', () => {
    expect(
      expandActionPlaceholders('/dashboards/${currentTenant}', {
        aliases: { currentTenant: 't-7' },
      })
    ).toBe('/dashboards/t-7');
  });

  it('mixes row + alias placeholders in the same value', () => {
    expect(
      expandActionPlaceholders('/customers/${row.customerId}/in/${currentTenant}', {
        row: { customerId: '42' },
        aliases: { currentTenant: 't-7' },
      })
    ).toBe('/customers/42/in/t-7');
  });

  it('leaves unknown placeholders verbatim (consumer / backend may resolve)', () => {
    expect(expandActionPlaceholders('${row.unknown}', { row: { x: '1' } })).toBe('${row.unknown}');
    expect(expandActionPlaceholders('${unknownAlias}', {})).toBe('${unknownAlias}');
  });

  it('coerces non-string row values to string', () => {
    expect(expandActionPlaceholders('${row.count}', { row: { count: 42 } })).toBe('42');
    expect(expandActionPlaceholders('${row.flag}', { row: { flag: true } })).toBe('true');
  });

  it('treats null / undefined row values as missing (placeholder left verbatim)', () => {
    expect(expandActionPlaceholders('${row.count}', { row: { count: null } })).toBe('${row.count}');
    expect(expandActionPlaceholders('${row.count}', { row: { count: undefined } })).toBe(
      '${row.count}'
    );
  });
});

describe('expandActionParams', () => {
  it('expands placeholders in every value', () => {
    const out = expandActionParams(
      { customerId: '${row.customerId}', tenant: '${currentTenant}' },
      { row: { customerId: '42' }, aliases: { currentTenant: 't-7' } }
    );
    expect(out).toEqual({ customerId: '42', tenant: 't-7' });
  });

  it('returns an empty map when params is null / undefined', () => {
    expect(expandActionParams(null, {})).toEqual({});
    expect(expandActionParams(undefined, {})).toEqual({});
  });

  it('preserves param keys regardless of substitution outcome', () => {
    const out = expandActionParams({ a: '${row.a}', b: 'literal' }, {});
    expect(Object.keys(out)).toEqual(['a', 'b']);
    expect(out.a).toBe('${row.a}');
    expect(out.b).toBe('literal');
  });
});

describe('expandActionTargetAndParams', () => {
  it('expands target + params together', () => {
    const out = expandActionTargetAndParams(
      '/customers/${row.customerId}',
      { status: 'unpaid' },
      { row: { customerId: '42' } }
    );
    expect(out.target).toBe('/customers/42');
    expect(out.params).toEqual({ status: 'unpaid' });
  });
});
