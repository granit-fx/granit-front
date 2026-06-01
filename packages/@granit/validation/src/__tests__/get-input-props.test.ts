import { describe, expect, it } from 'vitest';

import { getInputProps } from '../get-input-props';

describe('getInputProps', () => {
  it('returns empty object for empty constraint', () => {
    expect(getInputProps({})).toEqual({});
  });

  it('omits required (handled by resolver, not native validation)', () => {
    expect(getInputProps({ required: true })).toEqual({});
  });

  it('maps maxLength directly', () => {
    expect(getInputProps({ maxLength: 255 })).toEqual({ maxLength: 255 });
  });

  it('omits minLength (triggers native validation tooltip)', () => {
    expect(getInputProps({ minLength: 3 })).toEqual({});
  });

  it('omits pattern (triggers native validation tooltip)', () => {
    expect(getInputProps({ pattern: '^\\d{5}$' })).toEqual({});
  });

  it('maps format email to type email', () => {
    expect(getInputProps({ format: 'email' })).toEqual({ type: 'email' });
  });

  it('omits type for unknown format', () => {
    expect(getInputProps({ format: 'uuid' })).toEqual({});
  });

  it('maps minimum to min', () => {
    expect(getInputProps({ minimum: 0 })).toEqual({ min: 0 });
  });

  it('maps maximum to max', () => {
    expect(getInputProps({ maximum: 100 })).toEqual({ max: 100 });
  });

  it('adjusts exclusiveMinimum to min + 1 for integer bounds', () => {
    expect(getInputProps({ exclusiveMinimum: 0 })).toEqual({ min: 1 });
  });

  it('adjusts exclusiveMaximum to max - 1 for integer bounds', () => {
    expect(getInputProps({ exclusiveMaximum: 100 })).toEqual({ max: 99 });
  });

  it('prefers minimum over exclusiveMinimum when both present', () => {
    expect(getInputProps({ minimum: 5, exclusiveMinimum: 0 })).toEqual({ min: 5 });
  });

  it('prefers maximum over exclusiveMaximum when both present', () => {
    expect(getInputProps({ maximum: 50, exclusiveMaximum: 100 })).toEqual({ max: 50 });
  });

  it('only includes maxLength, type, min, max — never required, minLength, or pattern', () => {
    expect(
      getInputProps({
        required: true,
        maxLength: 255,
        minLength: 1,
        pattern: '^[a-z]+$',
        format: 'email',
        minimum: 0,
        maximum: 100,
      })
    ).toEqual({
      maxLength: 255,
      type: 'email',
      min: 0,
      max: 100,
    });
  });
});
