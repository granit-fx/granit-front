import { describe, expect, it, vi } from 'vitest';

import { createConstraintsResolver } from '../create-constraints-resolver.js';

import type { SchemaConstraints } from '@granit/validation';

function createFields(...names: string[]) {
  const fields: Record<string, { name: string }> = {};
  for (const name of names) {
    fields[name] = { name };
  }
  return fields;
}

describe('createConstraintsResolver', () => {
  const t = vi.fn((key: string, params?: Record<string, unknown>) => {
    if (params) {
      // Filter out i18next options so they don't appear in interpolated output
      const entries = Object.entries(params)
        .filter(([k]) => k !== 'nsSeparator')
        .map(([k, v]) => `${k}=${v}`)
        .join(', ');
      return entries ? `${key} (${entries})` : key;
    }
    return key;
  });

  const constraints: SchemaConstraints = {
    name: { required: true, maxLength: 100 },
    email: { required: true, format: 'email' },
    age: { minimum: 0, maximum: 150 },
  };

  it('returns empty errors for valid values', async () => {
    const resolver = createConstraintsResolver(constraints, t);
    const result = await resolver({ name: 'John', email: 'john@example.com', age: 25 }, undefined, {
      fields: createFields('name', 'email', 'age'),
    });
    expect(result.errors).toEqual({});
  });

  it('returns error with translated message for required violation', async () => {
    const resolver = createConstraintsResolver(constraints, t);
    const result = await resolver({ name: '', email: 'a@b.com' }, undefined, {
      fields: createFields('name', 'email'),
    });
    expect(result.errors['name']).toEqual({
      type: 'Validation:NotEmptyValidator',
      message: 'Validation:NotEmptyValidator (PropertyName=name)',
    });
  });

  it('returns error for maxLength violation', async () => {
    const resolver = createConstraintsResolver(constraints, t);
    const result = await resolver({ name: 'a'.repeat(101), email: 'a@b.com' }, undefined, {
      fields: createFields('name', 'email'),
    });
    expect(result.errors['name']!.type).toBe('Validation:MaximumLengthValidator');
  });

  it('returns error for pattern violation', async () => {
    const patternConstraints: SchemaConstraints = {
      code: { pattern: '^\\d{5}$' },
    };
    const resolver = createConstraintsResolver(patternConstraints, t);
    const result = await resolver({ code: 'abc' }, undefined, {
      fields: createFields('code'),
    });
    expect(result.errors['code']!.type).toBe('Validation:RegularExpressionValidator');
  });

  it('calls t() with error code and params for parameterized errors', async () => {
    t.mockClear();
    const resolver = createConstraintsResolver(constraints, t);
    await resolver({ name: 'a'.repeat(101), email: 'a@b.com' }, undefined, {
      fields: createFields('name', 'email'),
    });
    expect(t).toHaveBeenCalledWith('Validation:MaximumLengthValidator', {
      maxLength: 100,
      PropertyName: 'name',
      nsSeparator: false,
    });
  });

  it('returns only the first error when multiple constraints fail', async () => {
    const multiConstraints: SchemaConstraints = {
      value: { required: true, minLength: 5, pattern: '^\\d+$' },
    };
    const resolver = createConstraintsResolver(multiConstraints, t);
    const result = await resolver({ value: 'ab' }, undefined, {
      fields: createFields('value'),
    });
    // Only one error per field
    expect(result.errors['value']).toBeDefined();
    expect(Object.keys(result.errors)).toHaveLength(1);
  });

  it('ignores fields not present in constraints', async () => {
    const resolver = createConstraintsResolver(constraints, t);
    const result = await resolver({ name: 'John', email: 'a@b.com', unknown: '' }, undefined, {
      fields: createFields('name', 'email', 'unknown'),
    });
    expect(result.errors['unknown']).toBeUndefined();
  });

  it('only validates fields listed in options.fields', async () => {
    const resolver = createConstraintsResolver(constraints, t);
    // name is required but not in fields — should not be validated
    const result = await resolver({ name: '', email: 'a@b.com' }, undefined, {
      fields: createFields('email'),
    });
    expect(result.errors['name']).toBeUndefined();
    expect(result.errors).toEqual({});
  });

  it('returns a Promise (async resolver contract)', () => {
    const resolver = createConstraintsResolver(constraints, t);
    const result = resolver({ name: 'John' }, undefined, {
      fields: createFields('name'),
    });
    expect(result).toBeInstanceOf(Promise);
  });

  it('passes PropertyName to t() for validation errors', async () => {
    t.mockClear();
    const resolver = createConstraintsResolver(constraints, t);
    await resolver({ name: '' }, undefined, { fields: createFields('name') });
    expect(t).toHaveBeenCalledWith('Validation:NotEmptyValidator', {
      PropertyName: 'name',
      nsSeparator: false,
    });
  });

  it('uses labelResolver for PropertyName when provided', async () => {
    t.mockClear();
    const resolver = createConstraintsResolver(constraints, t, {
      labelResolver: (f) => f.toUpperCase(),
    });
    await resolver({ name: '' }, undefined, { fields: createFields('name') });
    expect(t).toHaveBeenCalledWith('Validation:NotEmptyValidator', {
      PropertyName: 'NAME',
      nsSeparator: false,
    });
  });

  it('falls back to fieldName when labelResolver is not provided', async () => {
    t.mockClear();
    const resolver = createConstraintsResolver(constraints, t);
    await resolver({ email: '' }, undefined, { fields: createFields('email') });
    expect(t).toHaveBeenCalledWith('Validation:NotEmptyValidator', {
      PropertyName: 'email',
      nsSeparator: false,
    });
  });
});
