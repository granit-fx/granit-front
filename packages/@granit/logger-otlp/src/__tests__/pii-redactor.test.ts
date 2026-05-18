import { describe, expect, it } from 'vitest';

import { defaultPiiRedactor } from '../pii-redactor.js';

describe('defaultPiiRedactor', () => {
  it('redacts emails', () => {
    expect(defaultPiiRedactor('user john.doe@example.com signed up')).toBe(
      'user joh***@example.com signed up'
    );
  });

  it('redacts Bearer tokens', () => {
    expect(defaultPiiRedactor('Authorization: Bearer abcdef1234567890')).toBe(
      'Authorization: Bearer abcd...890'
    );
  });

  it('redacts raw JWTs', () => {
    const jwt = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0In0.signature1234';
    expect(defaultPiiRedactor(`token=${jwt}`)).toBe('token=eyJh...234');
  });

  it('redacts IBANs', () => {
    expect(defaultPiiRedactor('IBAN BE68539007547034 transfer')).toBe('IBAN BE68*** transfer');
  });

  it('redacts E.164 phones', () => {
    expect(defaultPiiRedactor('Call +33612345678 now')).toBe('Call +336*****78 now');
  });

  it('redacts Luhn-valid credit cards', () => {
    // 4532015112830366 — valid Luhn
    expect(defaultPiiRedactor('Card 4532015112830366 used')).toBe('Card ***0366 used');
  });

  it('does NOT redact long numeric IDs that fail Luhn', () => {
    // 1234567890123456 — fails Luhn → must not be masked
    expect(defaultPiiRedactor('Order 1234567890123456')).toBe('Order 1234567890123456');
  });

  it('returns input unchanged when nothing matches', () => {
    expect(defaultPiiRedactor('Just a plain message')).toBe('Just a plain message');
  });

  it('handles empty string', () => {
    expect(defaultPiiRedactor('')).toBe('');
  });
});
