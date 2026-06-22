import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { checkSchemaConformance } from '../conformance';

import type { OpenApiDocument, OpenApiSchema } from '../conformance';

const here = path.dirname(fileURLToPath(import.meta.url));

// Edge-case coverage for the conformance oracle. Each test pins a single
// normalization / resolution branch the positive-control suite does not exercise.

const file = '/virtual/edge.ts';

/** Run the oracle against one schema declared inline as `Sample`. */
function check(spec: OpenApiDocument, source: string, typeName = 'Sample') {
  return checkSchemaConformance({
    spec,
    schemaName: 'Sample',
    sourceText: source,
    fileName: file,
    typeName,
  });
}

/** Build a single-schema spec with one required property. */
function oneProp(
  prop: OpenApiSchema,
  schemas: Record<string, OpenApiSchema> = {}
): OpenApiDocument {
  return {
    components: {
      schemas: {
        Sample: { type: 'object', required: ['value'], properties: { value: prop } },
        ...schemas,
      },
    },
  };
}

describe('checkSchemaConformance — schema lookup', () => {
  it('returns schema-missing when the spec has no such schema', () => {
    const v = checkSchemaConformance({
      spec: { components: { schemas: {} } },
      schemaName: 'Ghost',
      sourceText: 'export interface Ghost { readonly id: string; }',
      fileName: file,
    });
    expect(v).toEqual([
      expect.objectContaining({ rule: 'schema-missing', schema: 'Ghost', field: '*' }),
    ]);
  });

  it('returns schema-missing when components is entirely absent', () => {
    const v = checkSchemaConformance({
      spec: {},
      schemaName: 'Ghost',
      sourceText: 'export interface Ghost { readonly id: string; }',
      fileName: file,
    });
    expect(v[0]?.rule).toBe('schema-missing');
  });

  it('returns type-missing when the front type cannot be flattened', () => {
    // The TS source declares no `Sample` interface/alias.
    const v = check(oneProp({ type: 'string' }), 'export const unrelated = 1;');
    expect(v).toEqual([
      expect.objectContaining({ rule: 'type-missing', schema: 'Sample', field: '*' }),
    ]);
  });
});

describe('specFamily — type normalization', () => {
  it('maps integer/number/boolean spec types to their families', () => {
    expect(
      check(oneProp({ type: 'number' }), 'export interface Sample { readonly value: number; }')
    ).toEqual([]);
    expect(
      check(oneProp({ type: 'boolean' }), 'export interface Sample { readonly value: boolean; }')
    ).toEqual([]);
  });

  it('maps an array spec type to the array family', () => {
    const src = 'export interface Sample { readonly value: readonly string[]; }';
    expect(check(oneProp({ type: 'array', items: { type: 'string' } }), src)).toEqual([]);
  });

  it('maps a bare object spec type to the object family', () => {
    const src = 'export interface Sample { readonly value: { readonly a: string }; }';
    expect(check(oneProp({ type: 'object' }), src)).toEqual([]);
  });

  it('treats a typeless schema as unknown (no type-family drift)', () => {
    const src = 'export interface Sample { readonly value: number; }';
    expect(check(oneProp({}), src)).toEqual([]);
  });

  it('honours nullable: true (object form, not the ["null", T] form)', () => {
    const src = 'export interface Sample { readonly value: string; }';
    expect(check(oneProp({ type: 'string', nullable: true }), src)).toContainEqual(
      expect.objectContaining({ rule: 'nullability', field: 'value' })
    );
  });

  it('maps an inline string enum to the string family', () => {
    const src = "export interface Sample { readonly value: 'A' | 'B'; }";
    expect(check(oneProp({ enum: ['A', 'B'], type: 'string' }), src)).toEqual([]);
  });
});

describe('specFamily — $ref resolution', () => {
  it('resolves a $ref to the target schema family (string enum reads as string)', () => {
    const spec = oneProp(
      { $ref: '#/components/schemas/Kind' },
      { Kind: { enum: ['A', 'B'], type: 'string' } }
    );
    const src = "export interface Sample { readonly value: 'A' | 'B'; }";
    expect(check(spec, src)).toEqual([]);
  });

  it('treats a $ref to a missing schema as object', () => {
    const spec = oneProp({ $ref: '#/components/schemas/Nope' });
    const src = 'export interface Sample { readonly value: { readonly a: string }; }';
    expect(check(spec, src)).toEqual([]);
  });

  it('treats a $ref with no resolvable name (object) gracefully and propagates nullability', () => {
    // ["null"] on the ref site: the ref target is missing → object family, but
    // the null in the union must still propagate to nullable.
    const spec = oneProp({ $ref: '#/components/schemas/Nope', nullable: true });
    const src = 'export interface Sample { readonly value: { readonly a: string }; }';
    expect(check(spec, src)).toContainEqual(
      expect.objectContaining({ rule: 'nullability', field: 'value' })
    );
  });

  it('guards against a self-referential $ref cycle (resolves to object)', () => {
    const spec = oneProp(
      { $ref: '#/components/schemas/Loop' },
      { Loop: { $ref: '#/components/schemas/Loop' } }
    );
    const src = 'export interface Sample { readonly value: { readonly a: string }; }';
    // Cycle is broken: target becomes undefined the second time → object family.
    expect(check(spec, src)).toEqual([]);
  });

  it('propagates a nullable $ref target up to the referencing field', () => {
    const spec = oneProp(
      { $ref: '#/components/schemas/MaybeStr' },
      { MaybeStr: { type: ['null', 'string'] } }
    );
    const src = 'export interface Sample { readonly value: string; }';
    expect(check(spec, src)).toContainEqual(
      expect.objectContaining({ rule: 'nullability', field: 'value' })
    );
  });
});

describe('familyOf — TypeScript type-node families', () => {
  it('resolves Array<T> and ReadonlyArray<T> type references to array', () => {
    const a = 'export interface Sample { readonly value: Array<string>; }';
    const ro = 'export interface Sample { readonly value: ReadonlyArray<string>; }';
    expect(check(oneProp({ type: 'array' }), a)).toEqual([]);
    expect(check(oneProp({ type: 'array' }), ro)).toEqual([]);
  });

  it('resolves a known framework brand reference to its primitive family', () => {
    // ISODateString is a cross-package brand listed in BRAND_FAMILY → string.
    const src = 'export interface Sample { readonly value: ISODateString; }';
    expect(check(oneProp({ type: 'string' }), src)).toEqual([]);
  });

  it('resolves a numeric literal type to number and boolean literals to boolean', () => {
    expect(
      check(oneProp({ type: 'number' }), 'export interface Sample { readonly value: 42; }')
    ).toEqual([]);
    expect(
      check(oneProp({ type: 'boolean' }), 'export interface Sample { readonly value: true; }')
    ).toEqual([]);
  });

  it('treats a bare `null` literal field as unknown family (no type-family drift)', () => {
    // `value: null` is a lone LiteralTypeNode (not a union) → familyOfLiteralType
    // returns unknown, so no type-family drift is raised against any spec family.
    const src = 'export interface Sample { readonly value: null; }';
    const v = check(oneProp({ type: 'string' }), src);
    expect(v.some((x) => x.rule === 'type-family')).toBe(false);
  });

  it('accepts a `T | null` front union against a nullable spec field', () => {
    // The union path of tsFamily: null member sets nullable, string is the base;
    // it satisfies a nullable string spec field with no violation.
    const src = 'export interface Sample { readonly value: string | null; }';
    expect(check(oneProp({ type: ['null', 'string'] }), src)).toEqual([]);
  });

  it('reports a union with only nullish members as unknown base family', () => {
    // `null | undefined` → both members nullish → bases empty → first undefined →
    // family 'unknown'; no type-family drift against a string spec.
    const src = 'export interface Sample { readonly value: null | undefined; }';
    const v = check(oneProp({ type: 'string' }), src);
    expect(v.some((x) => x.rule === 'type-family')).toBe(false);
  });

  it('resolves an intersection (brand pattern) to the primitive member', () => {
    const src = "export interface Sample { readonly value: string & { readonly __brand: 'x' }; }";
    expect(check(oneProp({ type: 'string' }), src)).toEqual([]);
  });

  it('falls back to object for an intersection of only object members', () => {
    const src = 'export interface Sample { readonly value: { a: string } & { b: number }; }';
    expect(check(oneProp({ type: 'object' }), src)).toEqual([]);
  });

  it('resolves a type-literal node to object', () => {
    const src = 'export interface Sample { readonly value: { readonly a: string }; }';
    expect(check(oneProp({ type: 'object' }), src)).toEqual([]);
  });

  it('treats an unresolved type reference as object', () => {
    const src = 'export interface Sample { readonly value: SomeUnknownType; }';
    expect(check(oneProp({ type: 'object' }), src)).toEqual([]);
  });

  it('treats a tuple type as unknown (no type-family false positive)', () => {
    const src = 'export interface Sample { readonly value: [string, number]; }';
    expect(check(oneProp({ type: 'string' }), src).some((x) => x.rule === 'type-family')).toBe(
      false
    );
  });

  it('resolves a local string-union enum alias to string', () => {
    const src = `
      type Color = 'red' | 'green';
      export interface Sample { readonly value: Color; }`;
    expect(check(oneProp({ type: 'string' }), src)).toEqual([]);
  });

  it('resolves a readonly type operator through to the inner family', () => {
    const src = 'export interface Sample { readonly value: readonly number[]; }';
    expect(check(oneProp({ type: 'array' }), src)).toEqual([]);
  });
});

describe('tsFamily — union nullability', () => {
  it('reports a non-nullable front union as non-nullable', () => {
    // `string | number` — no nullish member, first base wins (string).
    const src = 'export interface Sample { readonly value: string | number; }';
    expect(check(oneProp({ type: 'string' }), src).some((x) => x.rule === 'nullability')).toBe(
      false
    );
  });

  it('handles a question-token optional field as nullable', () => {
    const src = 'export interface Sample { value?: string; }';
    // spec requires value & non-null → optional front prop is nullable, not missing.
    const v = check(oneProp({ type: 'string' }), src);
    expect(v.some((x) => x.rule === 'missing-field')).toBe(false);
  });
});

describe('module resolution — directory index fallback', () => {
  it('follows an import that resolves through <dir>/index.ts', () => {
    const dtoFile = path.join(here, '__fixtures__/dir-import/dto.ts');
    const spec: OpenApiDocument = {
      components: {
        schemas: {
          Sample: { type: 'object', required: ['kind'], properties: { kind: { $ref: '#/x' } } },
          x: { enum: ['Alpha', 'Beta'], type: 'string' },
        },
      },
    };
    const violations = checkSchemaConformance({
      spec,
      schemaName: 'Sample',
      sourceText: readFileSync(dtoFile, 'utf8'),
      fileName: dtoFile,
    });
    expect(violations).toEqual([]);
  });
});

describe('resolveDeclMembers — alias forwarding', () => {
  it('flattens an alias forwarding to an interface', () => {
    const src = `
      interface Base { readonly value: string; }
      export type Sample = Base;`;
    expect(check(oneProp({ type: 'string' }), src)).toEqual([]);
  });

  it('returns type-missing for an alias forwarding to a non-named type', () => {
    // `type Sample = string | number` — aliasTarget is a union, not a type ref,
    // so resolveDeclMembers cannot flatten it.
    const src = 'export type Sample = string | number;';
    expect(check(oneProp({ type: 'string' }), src)).toContainEqual(
      expect.objectContaining({ rule: 'type-missing' })
    );
  });
});

describe('compareField — type-family with unknown sides', () => {
  it('does not flag type-family when the front side is unknown', () => {
    const src = 'export interface Sample { readonly value: unknown; }';
    expect(check(oneProp({ type: 'string' }), src).some((x) => x.rule === 'type-family')).toBe(
      false
    );
  });
});

// Discriminated-union edge branches not covered by the positive controls.
describe('specDiscriminatedUnion — detection branches', () => {
  const unionSource = `
    interface MoveDelta { readonly kind: 'move'; readonly from: string; }
    interface DropDelta { readonly kind: 'drop'; readonly target: string; }
    export type Delta = MoveDelta | DropDelta;`;

  const checkDelta = (spec: OpenApiDocument, typeName = 'Delta') =>
    checkSchemaConformance({
      spec,
      schemaName: 'Delta',
      sourceText: unionSource,
      fileName: file,
      typeName,
    });

  it('treats anyOf + discriminator WITHOUT a mapping as a plain schema (no union path)', () => {
    // No mapping → specDiscriminatedUnion returns undefined → falls through to the
    // object oracle, which cannot flatten the union front type → type-missing.
    const spec: OpenApiDocument = {
      components: {
        schemas: {
          Delta: {
            type: 'object',
            required: ['kind'],
            anyOf: [{ $ref: '#/components/schemas/MoveDelta' }],
            discriminator: { propertyName: 'kind' },
          },
        },
      },
    };
    expect(checkDelta(spec)).toContainEqual(expect.objectContaining({ rule: 'type-missing' }));
  });

  it('skips a mapping ref pointing at a missing schema', () => {
    // The `rename` mapping points at a non-existent schema; it is dropped, so the
    // resolved union has only move+drop and the front matches → no violations.
    const spec: OpenApiDocument = {
      components: {
        schemas: {
          Delta: {
            type: 'object',
            required: ['kind'],
            oneOf: [
              { $ref: '#/components/schemas/MoveDelta' },
              { $ref: '#/components/schemas/DropDelta' },
            ],
            discriminator: {
              propertyName: 'kind',
              mapping: {
                move: '#/components/schemas/MoveDelta',
                drop: '#/components/schemas/DropDelta',
                rename: '#/components/schemas/Missing',
              },
            },
          },
          MoveDelta: {
            type: 'object',
            required: ['kind', 'from'],
            properties: { kind: { enum: ['move'], type: 'string' }, from: { type: 'string' } },
          },
          DropDelta: {
            type: 'object',
            required: ['kind', 'target'],
            properties: { kind: { enum: ['drop'], type: 'string' }, target: { type: 'string' } },
          },
        },
      },
    };
    expect(checkDelta(spec)).toEqual([]);
  });

  it('reports orphan-variant for a front member whose tag has no spec variant', () => {
    // Spec maps only `move`; front still has a `drop` member → orphan-variant.
    const spec: OpenApiDocument = {
      components: {
        schemas: {
          Delta: {
            type: 'object',
            required: ['kind'],
            oneOf: [{ $ref: '#/components/schemas/MoveDelta' }],
            discriminator: {
              propertyName: 'kind',
              mapping: { move: '#/components/schemas/MoveDelta' },
            },
          },
          MoveDelta: {
            type: 'object',
            required: ['kind', 'from'],
            properties: { kind: { enum: ['move'], type: 'string' }, from: { type: 'string' } },
          },
        },
      },
    };
    expect(checkDelta(spec)).toContainEqual(
      expect.objectContaining({ rule: 'orphan-variant', message: expect.stringContaining('drop') })
    );
  });
});

describe('resolveUnionVariants — non-union front types', () => {
  it('reports type-missing when the union alias mixes non-type-reference members', () => {
    // `type Delta = MoveDelta | { inline: true }` — the inline member is not a
    // named type ref; only MoveDelta resolves. Spec demands a drop variant too.
    const src = `
      interface MoveDelta { readonly kind: 'move'; readonly from: string; }
      export type Delta = MoveDelta | { readonly inline: true };`;
    const spec: OpenApiDocument = {
      components: {
        schemas: {
          Delta: {
            type: 'object',
            required: ['kind'],
            oneOf: [
              { $ref: '#/components/schemas/MoveDelta' },
              { $ref: '#/components/schemas/DropDelta' },
            ],
            discriminator: {
              propertyName: 'kind',
              mapping: {
                move: '#/components/schemas/MoveDelta',
                drop: '#/components/schemas/DropDelta',
              },
            },
          },
          MoveDelta: {
            type: 'object',
            required: ['kind', 'from'],
            properties: { kind: { enum: ['move'], type: 'string' }, from: { type: 'string' } },
          },
          DropDelta: {
            type: 'object',
            required: ['kind', 'target'],
            properties: { kind: { enum: ['drop'], type: 'string' }, target: { type: 'string' } },
          },
        },
      },
    };
    const v = checkSchemaConformance({
      spec,
      schemaName: 'Delta',
      sourceText: src,
      fileName: file,
    });
    expect(v).toContainEqual(expect.objectContaining({ rule: 'missing-variant' }));
  });

  it('reports type-missing when a union member lacks the discriminator tag', () => {
    // DropDelta has no string-literal `kind` → discriminatorValueOf returns
    // undefined, so it is never registered by tag → spec drop has no front match.
    const src = `
      interface MoveDelta { readonly kind: 'move'; readonly from: string; }
      interface DropDelta { readonly target: string; }
      export type Delta = MoveDelta | DropDelta;`;
    const spec: OpenApiDocument = {
      components: {
        schemas: {
          Delta: {
            type: 'object',
            required: ['kind'],
            oneOf: [
              { $ref: '#/components/schemas/MoveDelta' },
              { $ref: '#/components/schemas/DropDelta' },
            ],
            discriminator: {
              propertyName: 'kind',
              mapping: {
                move: '#/components/schemas/MoveDelta',
                drop: '#/components/schemas/DropDelta',
              },
            },
          },
          MoveDelta: {
            type: 'object',
            required: ['kind', 'from'],
            properties: { kind: { enum: ['move'], type: 'string' }, from: { type: 'string' } },
          },
          DropDelta: {
            type: 'object',
            required: ['target'],
            properties: { target: { type: 'string' } },
          },
        },
      },
    };
    const v = checkSchemaConformance({
      spec,
      schemaName: 'Delta',
      sourceText: src,
      fileName: file,
    });
    expect(v).toContainEqual(
      expect.objectContaining({ rule: 'missing-variant', message: expect.stringContaining('drop') })
    );
  });
});
