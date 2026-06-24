import { describe, expect, it } from 'vitest';

import { formatPhoneInternational } from '../inputs/format-phone';

describe('formatPhoneInternational', () => {
  it('formats a valid Belgian E.164 number', () => {
    expect(formatPhoneInternational('+32479123456')).toBe('+32 479 12 34 56');
  });

  it('formats a valid US E.164 number', () => {
    expect(formatPhoneInternational('+12125551234')).toBe('+1 212 555 1234');
  });

  it('returns empty string for null', () => {
    expect(formatPhoneInternational(null)).toBe('');
  });

  it('returns empty string for undefined', () => {
    expect(formatPhoneInternational(undefined)).toBe('');
  });

  it('returns empty string for empty string', () => {
    expect(formatPhoneInternational('')).toBe('');
  });

  it('falls back to the raw value for an unparseable input', () => {
    const input = 'not-a-phone-number';
    expect(formatPhoneInternational(input)).toBe(input);
  });
});
