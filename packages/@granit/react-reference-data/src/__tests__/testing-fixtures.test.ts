import { describe, expect, it } from 'vitest';

import { buildBaseEntry, makeReferenceDataEntry } from '../testing';

import type { ReferenceDataResponse } from '@granit/reference-data';

interface Country extends ReferenceDataResponse {
  readonly alpha3: string;
  readonly region: string;
}

describe('makeReferenceDataEntry', () => {
  it('defaults every label slot the seed does not state', () => {
    const entry = makeReferenceDataEntry({
      id: 'bd85759d-a3a1-584e-be05-6b1f605ccad2',
      code: 'INVOICE',
      labelEn: 'Invoice',
    });

    expect(entry.labelEn).toBe('Invoice');
    expect(entry.labelFr).toBe('');
    expect(entry.labelHi).toBe('');
    expect(entry.label).toBe('');
  });

  it('defaults an entry to active, unordered, unscoped and metadata-free', () => {
    const entry = makeReferenceDataEntry({ id: 'a', code: 'X' });

    expect(entry.activated).toBe(true);
    expect(entry.sortOrder).toBe(0);
    expect(entry.validFrom).toBeNull();
    expect(entry.validTo).toBeNull();
    expect(entry.parentCode).toBeNull();
    expect(entry.metadata).toBeNull();
  });

  it('lets the seed override any default', () => {
    const entry = makeReferenceDataEntry({
      id: 'a',
      code: 'RETIRED',
      activated: false,
      sortOrder: 7,
      parentCode: 'ROOT',
      metadata: { taxRate: '21' },
    });

    expect(entry.activated).toBe(false);
    expect(entry.sortOrder).toBe(7);
    expect(entry.parentCode).toBe('ROOT');
    expect(entry.metadata).toEqual({ taxRate: '21' });
  });

  it('brands the id so fixtures type-check against the entity id', () => {
    const entry = makeReferenceDataEntry({
      id: 'd87bbc3c-f725-5171-a64a-3eefc69e48a8',
      code: 'FR',
    });

    expect(entry.id).toBe('d87bbc3c-f725-5171-a64a-3eefc69e48a8');
  });

  it('carries the fields an extending entity adds', () => {
    const france = makeReferenceDataEntry<Country>({
      id: 'd87bbc3c-f725-5171-a64a-3eefc69e48a8',
      code: 'FR',
      labelEn: 'France',
      alpha3: 'FRA',
      region: 'Europe',
    });

    expect(france.alpha3).toBe('FRA');
    expect(france.region).toBe('Europe');
    expect(france.activated).toBe(true);
  });
});

describe('buildBaseEntry', () => {
  it('maps each label from its own field', () => {
    const entry = buildBaseEntry({ code: 'X', labelCs: 'Ceska', labelHi: 'Hindi' });

    expect(entry.labelCs).toBe('Ceska');
    expect(entry.labelHi).toBe('Hindi');
  });

  it('leaves labelHi empty when the body omits it', () => {
    const entry = buildBaseEntry({ code: 'X', labelCs: 'Ceska' });

    expect(entry.labelHi).toBe('');
  });
});
