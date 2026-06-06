import { describe, expect, expectTypeOf, it } from 'vitest';

import { isTimeZoneId, toTimeZoneId } from '../timezone-id';

import type { TimeZoneId } from '../timezone-id';

describe('TimeZoneId', () => {
  it('toTimeZoneId returns the same string value', () => {
    const raw = 'Europe/Brussels';
    const branded = toTimeZoneId(raw);

    expect(branded).toBe(raw);
  });

  it('branded value is assignable to string', () => {
    const branded: TimeZoneId = toTimeZoneId('America/New_York');
    const plain: string = branded;

    expect(plain).toBe('America/New_York');
  });

  it('supports string operations', () => {
    const branded = toTimeZoneId('Asia/Tokyo');

    expect(branded.startsWith('Asia')).toBe(true);
    expect(branded.includes('/')).toBe(true);
  });
});

describe('isTimeZoneId', () => {
  it('returns true for a non-empty string', () => {
    expect(isTimeZoneId('Europe/Brussels')).toBe(true);
    expect(isTimeZoneId('UTC')).toBe(true);
  });

  it('returns false for an empty string', () => {
    expect(isTimeZoneId('')).toBe(false);
  });

  it('returns false for non-string values', () => {
    expect(isTimeZoneId(null)).toBe(false);
    expect(isTimeZoneId(undefined)).toBe(false);
    expect(isTimeZoneId(42)).toBe(false);
    expect(isTimeZoneId({})).toBe(false);
  });

  it('narrows the type to TimeZoneId', () => {
    const value: unknown = 'Europe/Paris';

    if (isTimeZoneId(value)) {
      expectTypeOf(value).toMatchTypeOf<TimeZoneId>();
    }
  });
});
