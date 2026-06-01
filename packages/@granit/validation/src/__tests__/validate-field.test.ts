import { describe, expect, it } from 'vitest';

import { VALIDATION_ERROR_CODES } from '../constants/error-codes';
import { validateField } from '../validate-field';

describe('validateField', () => {
  it('returns no errors for a valid non-empty string with no constraints', () => {
    expect(validateField('hello', {})).toEqual([]);
  });

  it('returns required error for undefined value', () => {
    const errors = validateField(undefined, { required: true });
    expect(errors).toEqual([{ code: VALIDATION_ERROR_CODES.required }]);
  });

  it('returns required error for null value', () => {
    const errors = validateField(null, { required: true });
    expect(errors).toEqual([{ code: VALIDATION_ERROR_CODES.required }]);
  });

  it('returns required error for empty string', () => {
    const errors = validateField('', { required: true });
    expect(errors).toEqual([{ code: VALIDATION_ERROR_CODES.required }]);
  });

  it('returns required error for whitespace-only string', () => {
    const errors = validateField('   ', { required: true });
    expect(errors).toEqual([{ code: VALIDATION_ERROR_CODES.required }]);
  });

  it('returns no required error when field is not required and value is empty', () => {
    expect(validateField('', { required: false })).toEqual([]);
    expect(validateField(undefined, {})).toEqual([]);
  });

  it('skips all other checks when value is empty and not required', () => {
    expect(validateField('', { maxLength: 5, minLength: 1, pattern: '^\\d+$' })).toEqual([]);
  });

  it('returns maxLength error when string exceeds limit', () => {
    const errors = validateField('abcdef', { maxLength: 5 });
    expect(errors).toEqual([{ code: VALIDATION_ERROR_CODES.maxLength, params: { maxLength: 5 } }]);
  });

  it('returns no maxLength error when string is at limit', () => {
    expect(validateField('abcde', { maxLength: 5 })).toEqual([]);
  });

  it('returns minLength error when string is below limit', () => {
    const errors = validateField('ab', { minLength: 3 });
    expect(errors).toEqual([{ code: VALIDATION_ERROR_CODES.minLength, params: { minLength: 3 } }]);
  });

  it('returns no minLength error when string is at limit', () => {
    expect(validateField('abc', { minLength: 3 })).toEqual([]);
  });

  it('returns pattern error when string does not match regex', () => {
    const errors = validateField('abc', { pattern: '^\\d+$' });
    expect(errors).toEqual([
      { code: VALIDATION_ERROR_CODES.pattern, params: { pattern: '^\\d+$' } },
    ]);
  });

  it('returns no pattern error when string matches regex', () => {
    expect(validateField('123', { pattern: '^\\d+$' })).toEqual([]);
  });

  it('returns email format error for invalid email', () => {
    const errors = validateField('not-an-email', { format: 'email' });
    expect(errors).toEqual([{ code: VALIDATION_ERROR_CODES.formatEmail }]);
  });

  it('returns no email error for valid email', () => {
    expect(validateField('user@example.com', { format: 'email' })).toEqual([]);
  });

  it('returns minimum error when number is below minimum', () => {
    const errors = validateField(-1, { minimum: 0 });
    expect(errors).toEqual([{ code: VALIDATION_ERROR_CODES.minimum, params: { minimum: 0 } }]);
  });

  it('returns no minimum error when number equals minimum (inclusive)', () => {
    expect(validateField(0, { minimum: 0 })).toEqual([]);
  });

  it('returns maximum error when number exceeds maximum', () => {
    const errors = validateField(101, { maximum: 100 });
    expect(errors).toEqual([{ code: VALIDATION_ERROR_CODES.maximum, params: { maximum: 100 } }]);
  });

  it('returns no maximum error when number equals maximum (inclusive)', () => {
    expect(validateField(100, { maximum: 100 })).toEqual([]);
  });

  it('returns exclusiveMinimum error when number equals the bound', () => {
    const errors = validateField(0, { exclusiveMinimum: 0 });
    expect(errors).toEqual([
      { code: VALIDATION_ERROR_CODES.exclusiveMinimum, params: { exclusiveMinimum: 0 } },
    ]);
  });

  it('returns exclusiveMaximum error when number equals the bound', () => {
    const errors = validateField(100, { exclusiveMaximum: 100 });
    expect(errors).toEqual([
      {
        code: VALIDATION_ERROR_CODES.exclusiveMaximum,
        params: { exclusiveMaximum: 100 },
      },
    ]);
  });

  it('returns multiple errors when multiple constraints fail simultaneously', () => {
    const errors = validateField('x', {
      required: true,
      minLength: 3,
      pattern: '^\\d+$',
    });
    expect(errors).toHaveLength(2);
    expect(errors.map((e) => e.code)).toContain(VALIDATION_ERROR_CODES.minLength);
    expect(errors.map((e) => e.code)).toContain(VALIDATION_ERROR_CODES.pattern);
  });
});
