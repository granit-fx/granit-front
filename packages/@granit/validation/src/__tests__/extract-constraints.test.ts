import { describe, expect, it } from 'vitest';

import { extractConstraints } from '../extract-constraints';

import type { OpenApiSpec } from '../types/index';

describe('extractConstraints', () => {
  it('returns empty SpecConstraints for a spec with no schemas', () => {
    const spec: OpenApiSpec = {};
    expect(extractConstraints(spec)).toEqual({});
  });

  it('returns empty SpecConstraints for a spec with empty schemas', () => {
    const spec: OpenApiSpec = { components: { schemas: {} } };
    expect(extractConstraints(spec)).toEqual({});
  });

  it('extracts constraints from a simple schema with string properties', () => {
    const spec: OpenApiSpec = {
      components: {
        schemas: {
          CreateRequest: {
            type: 'object',
            properties: {
              name: { type: 'string', maxLength: 100, minLength: 1 },
            },
          },
        },
      },
    };

    const result = extractConstraints(spec);
    expect(result['CreateRequest']).toEqual({
      name: { maxLength: 100, minLength: 1 },
    });
  });

  it('marks fields as required when listed in schema.required array', () => {
    const spec: OpenApiSpec = {
      components: {
        schemas: {
          Form: {
            type: 'object',
            required: ['email'],
            properties: {
              email: { type: 'string', format: 'email' },
              nickname: { type: 'string' },
            },
          },
        },
      },
    };

    const result = extractConstraints(spec);
    expect(result['Form']!['email']).toEqual({ required: true, format: 'email' });
    expect(result['Form']!['nickname']).toEqual({});
  });

  it('extracts numeric constraints (minimum, maximum, exclusiveMinimum, exclusiveMaximum)', () => {
    const spec: OpenApiSpec = {
      components: {
        schemas: {
          Range: {
            type: 'object',
            properties: {
              age: { type: 'integer', minimum: 0, maximum: 150 },
              score: { type: 'number', exclusiveMinimum: 0, exclusiveMaximum: 100 },
            },
          },
        },
      },
    };

    const result = extractConstraints(spec);
    expect(result['Range']!['age']).toEqual({ minimum: 0, maximum: 150 });
    expect(result['Range']!['score']).toEqual({
      exclusiveMinimum: 0,
      exclusiveMaximum: 100,
    });
  });

  it('extracts pattern constraint', () => {
    const spec: OpenApiSpec = {
      components: {
        schemas: {
          Code: {
            type: 'object',
            properties: {
              postalCode: { type: 'string', pattern: '^\\d{5}$' },
            },
          },
        },
      },
    };

    const result = extractConstraints(spec);
    expect(result['Code']!['postalCode']).toEqual({ pattern: '^\\d{5}$' });
  });

  it('extracts format constraint (email)', () => {
    const spec: OpenApiSpec = {
      components: {
        schemas: {
          Contact: {
            type: 'object',
            properties: {
              email: { type: 'string', format: 'email' },
            },
          },
        },
      },
    };

    const result = extractConstraints(spec);
    expect(result['Contact']!['email']).toEqual({ format: 'email' });
  });

  it('extracts x-granit-validator as granitValidator', () => {
    const spec: OpenApiSpec = {
      components: {
        schemas: {
          Payment: {
            type: 'object',
            properties: {
              iban: {
                type: 'string',
                'x-granit-validator': 'Validation:InvalidIban',
              },
            },
          },
        },
      },
    };

    const result = extractConstraints(spec);
    expect(result['Payment']!['iban']).toEqual({
      granitValidator: 'Validation:InvalidIban',
    });
  });

  it('resolves $ref to another schema within allOf', () => {
    const spec: OpenApiSpec = {
      components: {
        schemas: {
          BaseEntity: {
            type: 'object',
            required: ['id'],
            properties: {
              id: { type: 'string', format: 'uuid' },
            },
          },
          CreateRequest: {
            allOf: [
              { $ref: '#/components/schemas/BaseEntity' },
              {
                type: 'object',
                required: ['name'],
                properties: {
                  name: { type: 'string', maxLength: 200 },
                },
              },
            ],
          },
        },
      },
    };

    const result = extractConstraints(spec);
    expect(result['CreateRequest']).toEqual({
      id: { required: true, format: 'uuid' },
      name: { required: true, maxLength: 200 },
    });
  });

  it('merges multiple allOf entries (properties union)', () => {
    const spec: OpenApiSpec = {
      components: {
        schemas: {
          Combined: {
            allOf: [
              { properties: { a: { type: 'string', maxLength: 10 } } },
              { properties: { b: { type: 'integer', minimum: 0 } } },
            ],
          },
        },
      },
    };

    const result = extractConstraints(spec);
    expect(result['Combined']).toEqual({
      a: { maxLength: 10 },
      b: { minimum: 0 },
    });
  });

  it('deduplicates required fields across allOf entries', () => {
    const spec: OpenApiSpec = {
      components: {
        schemas: {
          Dup: {
            allOf: [
              { required: ['name'], properties: { name: { type: 'string' } } },
              { required: ['name', 'age'], properties: { age: { type: 'integer' } } },
            ],
          },
        },
      },
    };

    const result = extractConstraints(spec);
    expect(result['Dup']!['name']).toEqual({ required: true });
    expect(result['Dup']!['age']).toEqual({ required: true });
  });

  it('handles $ref pointing to non-existent schema gracefully', () => {
    const spec: OpenApiSpec = {
      components: {
        schemas: {
          Broken: {
            allOf: [
              { $ref: '#/components/schemas/DoesNotExist' },
              { properties: { valid: { type: 'string', maxLength: 50 } } },
            ],
          },
        },
      },
    };

    const result = extractConstraints(spec);
    expect(result['Broken']).toEqual({ valid: { maxLength: 50 } });
  });

  it('filters by options.schemas whitelist', () => {
    const spec: OpenApiSpec = {
      components: {
        schemas: {
          Alpha: { properties: { a: { type: 'string', maxLength: 10 } } },
          Beta: { properties: { b: { type: 'string', maxLength: 20 } } },
          Gamma: { properties: { c: { type: 'string', maxLength: 30 } } },
        },
      },
    };

    const result = extractConstraints(spec, { schemas: ['Alpha', 'Gamma'] });
    expect(Object.keys(result)).toEqual(['Alpha', 'Gamma']);
  });

  it('filters by options.schemaPattern regex', () => {
    const spec: OpenApiSpec = {
      components: {
        schemas: {
          CreateUserRequest: {
            properties: { name: { type: 'string', maxLength: 100 } },
          },
          UpdateUserRequest: {
            properties: { name: { type: 'string', maxLength: 100 } },
          },
          UserResponse: {
            properties: { name: { type: 'string' } },
          },
        },
      },
    };

    const result = extractConstraints(spec, { schemaPattern: /Request$/ });
    expect(Object.keys(result)).toEqual(['CreateUserRequest', 'UpdateUserRequest']);
  });
});
