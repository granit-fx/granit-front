import { describe, expect, it } from 'vitest';

import { substituteAliases, substituteAliasesInRecord } from '../lib/substitute-aliases';

describe('substituteAliases', () => {
  it('substitutes a single placeholder', () => {
    expect(substituteAliases('${currentCustomer}', { currentCustomer: '42' })).toBe('42');
  });

  it('substitutes multiple placeholders in the same string', () => {
    expect(
      substituteAliases('customer/${currentCustomer}/device/${selectedDevice}', {
        currentCustomer: '42',
        selectedDevice: 'd-7',
      })
    ).toBe('customer/42/device/d-7');
  });

  it('leaves unknown placeholders verbatim (consumer / backend may resolve them)', () => {
    expect(substituteAliases('${currentCustomer} / ${unresolved}', { currentCustomer: '42' })).toBe(
      '42 / ${unresolved}'
    );
  });

  it('returns the input verbatim when aliases is null / undefined', () => {
    expect(substituteAliases('${currentCustomer}', null)).toBe('${currentCustomer}');
    expect(substituteAliases('${currentCustomer}', undefined)).toBe('${currentCustomer}');
  });

  it('does not substitute malformed placeholders (missing brace, spaces, etc.)', () => {
    expect(substituteAliases('${ currentCustomer }', { currentCustomer: '42' })).toBe(
      '${ currentCustomer }'
    );
    expect(substituteAliases('$currentCustomer', { currentCustomer: '42' })).toBe(
      '$currentCustomer'
    );
  });
});

describe('substituteAliasesInRecord', () => {
  it('substitutes placeholders in every value', () => {
    const out = substituteAliasesInRecord(
      { Customer: '${currentCustomer}', Status: 'Open' },
      { currentCustomer: '42' }
    );
    expect(out).toEqual({ Customer: '42', Status: 'Open' });
  });

  it('returns the input reference verbatim when no substitution is needed', () => {
    const input = { Customer: '42', Status: 'Open' };
    const out = substituteAliasesInRecord(input, { currentCustomer: 'whatever' });
    expect(out).toBe(input);
  });

  it('returns the input verbatim when aliases is empty / null', () => {
    const input = { Customer: '${currentCustomer}' };
    expect(substituteAliasesInRecord(input, {})).toBe(input);
    expect(substituteAliasesInRecord(input, null)).toBe(input);
  });
});
