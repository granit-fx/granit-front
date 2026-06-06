import { describe, expect, expectTypeOf, it } from 'vitest';

import { isISODateString, toISODateString } from '../iso-date-string';

import type { ISODateString } from '../iso-date-string';

describe('ISODateString', () => {
  it('toISODateString returns the same string value', () => {
    const raw = '2024-12-31T23:59:59Z';
    const branded = toISODateString(raw);

    expect(branded).toBe(raw);
  });

  it('branded value is assignable to string', () => {
    const branded: ISODateString = toISODateString('2024-01-01T00:00:00Z');
    const plain: string = branded;

    expect(plain).toBe('2024-01-01T00:00:00Z');
  });

  it('supports string operations', () => {
    const branded = toISODateString('2024-06-15T12:30:00Z');

    expect(branded.startsWith('2024')).toBe(true);
    expect(branded.includes('T')).toBe(true);
    expect(branded.length).toBeGreaterThan(0);
  });

  it('works with Date constructor', () => {
    const branded = toISODateString('2024-06-15T12:30:00Z');
    const date = new Date(branded);

    expect(date.getFullYear()).toBe(2024);
    expect(date.getMonth()).toBe(5);
  });
});

describe('isISODateString', () => {
  it('returns true for a non-empty string', () => {
    expect(isISODateString('2024-12-31T23:59:59Z')).toBe(true);
    expect(isISODateString('any-non-empty')).toBe(true);
  });

  it('returns false for an empty string', () => {
    expect(isISODateString('')).toBe(false);
  });

  it('returns false for non-string values', () => {
    expect(isISODateString(null)).toBe(false);
    expect(isISODateString(undefined)).toBe(false);
    expect(isISODateString(42)).toBe(false);
  });

  it('narrows the type to ISODateString', () => {
    const value: unknown = '2024-01-01T00:00:00Z';

    if (isISODateString(value)) {
      expectTypeOf(value).toMatchTypeOf<ISODateString>();
    }
  });
});
