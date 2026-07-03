import { describe, expect, it } from 'vitest';

import { fieldToColumnDefinition, makeCurrencyResolver } from '../entity-kanban-view';

import type { EntityFormFieldManifest } from '@granit/entities';

function makeField(overrides: Partial<EntityFormFieldManifest> = {}): EntityFormFieldManifest {
  return {
    propertyName: 'Website',
    clrTypeName: 'String',
    component: 'text',
    config: null,
    labelKey: null,
    helpKey: null,
    order: 0,
    readOnly: false,
    visibleIf: null,
    lookup: null,
    provenance: null,
    ...overrides,
  };
}

describe('fieldToColumnDefinition', () => {
  it('camelCases the property name and carries the field valueKind', () => {
    const col = fieldToColumnDefinition(makeField({ propertyName: 'Website', valueKind: 'Url' }));
    expect(col.name).toBe('website');
    expect(col.type).toBe('String');
    expect(col.valueKind).toBe('Url');
  });

  it('suppresses valueKind on a money field (cents flow through the money path)', () => {
    // A money form field carries Int64 minor units; its Currency valueKind
    // (major units) must not hijack the shared formatter.
    const col = fieldToColumnDefinition(
      makeField({ propertyName: 'Amount', component: 'money', valueKind: 'Currency' })
    );
    expect(col.valueKind).toBeUndefined();
  });

  it('leaves valueKind undefined when the field declares none', () => {
    expect(fieldToColumnDefinition(makeField()).valueKind).toBeUndefined();
  });
});

describe('makeCurrencyResolver', () => {
  it('reads the configured currencyProperty (camelCased) from the row', () => {
    const resolve = makeCurrencyResolver(
      makeField({ component: 'money', config: { currencyProperty: 'PaidCurrency' } })
    );
    expect(resolve({ paidCurrency: 'USD' })).toBe('USD');
  });

  it('falls back to a row-level currency, then EUR', () => {
    const resolve = makeCurrencyResolver(makeField({ component: 'money' }));
    expect(resolve({ currency: 'GBP' })).toBe('GBP');
    expect(resolve({})).toBe('EUR');
  });
});
