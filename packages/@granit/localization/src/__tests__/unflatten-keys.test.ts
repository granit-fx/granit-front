import { describe, expect, it } from 'vitest';

import { unflattenKeys } from '../unflatten-keys.js';

describe('unflattenKeys', () => {
  it('should unflatten dot-separated keys into a nested object', () => {
    const flat = {
      'Auth.Login.Title': 'Sign in',
      'Auth.Login.Subtitle': 'Welcome back',
      'Auth.Register.Title': 'Create account',
    };

    expect(unflattenKeys(flat)).toEqual({
      Auth: {
        Login: { Title: 'Sign in', Subtitle: 'Welcome back' },
        Register: { Title: 'Create account' },
      },
    });
  });

  it('should keep flat keys (no dot) at the root level', () => {
    const flat = { SimpleKey: 'value', AnotherKey: 'other' };

    expect(unflattenKeys(flat)).toEqual({
      SimpleKey: 'value',
      AnotherKey: 'other',
    });
  });

  it('should convert SmartFormat single-brace placeholders to i18next double-brace', () => {
    const flat = { 'Errors.Required': '{Field} is required' };

    expect(unflattenKeys(flat)).toEqual({
      Errors: { Required: '{{Field}} is required' },
    });
  });

  it('should not double-convert already-double-braced placeholders', () => {
    const flat = { 'Errors.Range': '{{Field}} must be between {{Min}} and {{Max}}' };

    expect(unflattenKeys(flat)).toEqual({
      Errors: { Range: '{{Field}} must be between {{Min}} and {{Max}}' },
    });
  });

  it('should pass through non-string values unchanged', () => {
    // The function signature accepts Record<string, string>, but in practice
    // JSON.parse may return mixed types. Verify robustness.
    const flat = { count: 42 as unknown as string };

    expect(unflattenKeys(flat)).toEqual({ count: 42 });
  });

  it('should handle an empty input', () => {
    expect(unflattenKeys({})).toEqual({});
  });

  it('should handle deeply nested keys', () => {
    const flat = { 'A.B.C.D.E': 'deep' };

    expect(unflattenKeys(flat)).toEqual({
      A: { B: { C: { D: { E: 'deep' } } } },
    });
  });
});
