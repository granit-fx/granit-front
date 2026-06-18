import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { checkSchemaConformance } from '../conformance';

import type { OpenApiDocument, OpenApiSchema } from '../conformance';

const here = path.dirname(fileURLToPath(import.meta.url));

// A spec with one field of each kind the oracle reasons about, plus the
// representation warts the normalization table must absorb.
const spec: OpenApiDocument = {
  components: {
    schemas: {
      Sample: {
        type: 'object',
        required: ['id', 'count', 'when', 'flag', 'note'],
        properties: {
          id: { type: 'string', format: 'uuid' },
          count: { type: ['integer', 'string'], format: 'int32' }, // wart → number
          when: { type: ['null', 'string'], format: 'date-time' }, // nullable
          flag: { type: 'boolean' },
          note: { type: ['null', 'string'] },
        },
      },
    },
  },
};

const file = '/virtual/sample.ts';

function check(source: string) {
  return checkSchemaConformance({ spec, schemaName: 'Sample', sourceText: source, fileName: file });
}

describe('conformance oracle — positive & negative controls', () => {
  it('passes when the front type mirrors the contract (warts absorbed)', () => {
    const ok = `
      type ISODateString = string & { __brand: 'iso' };
      export interface Sample {
        readonly id: string;
        readonly count: number;          // satisfies integer|string
        readonly when: ISODateString | null;
        readonly flag: boolean;
        readonly note: string | null;
      }`;
    expect(check(ok)).toEqual([]);
  });

  it('flags a missing required field', () => {
    const src = `export interface Sample {
      readonly id: string; readonly count: number;
      readonly when: string | null; readonly flag: boolean;
    }`; // drops `note`
    expect(check(src)).toContainEqual(
      expect.objectContaining({ rule: 'missing-field', field: 'note' })
    );
  });

  it('flags a nullability mismatch (backend nullable, front not)', () => {
    const src = `export interface Sample {
      readonly id: string; readonly count: number;
      readonly when: string;            // backend allows null, front does not
      readonly flag: boolean; readonly note: string | null;
    }`;
    expect(check(src)).toContainEqual(
      expect.objectContaining({ rule: 'nullability', field: 'when' })
    );
  });

  it('treats an `unknown` front field as nullable (opaque payload, no phantom drift)', () => {
    // `note` is nullable backend-side; `unknown` subsumes null, so mirroring an
    // opaque JsonElement as `unknown` must not raise a nullability violation.
    const src = `export interface Sample {
      readonly id: string; readonly count: number;
      readonly when: string | null; readonly flag: boolean;
      readonly note: unknown;
    }`;
    expect(check(src)).toEqual([]);
  });

  it('flags a type-family mismatch', () => {
    const src = `export interface Sample {
      readonly id: number;              // backend string, front number
      readonly count: number; readonly when: string | null;
      readonly flag: boolean; readonly note: string | null;
    }`;
    expect(check(src)).toContainEqual(
      expect.objectContaining({ rule: 'type-family', field: 'id' })
    );
  });

  it('flags an orphan field absent from the backend schema', () => {
    const src = `export interface Sample {
      readonly id: string; readonly count: number;
      readonly when: string | null; readonly flag: boolean;
      readonly note: string | null; readonly extra: string;  // not in spec
    }`;
    expect(check(src)).toContainEqual(
      expect.objectContaining({ rule: 'orphan-field', field: 'extra' })
    );
  });

  it('passes when optional spec fields are absent from the front (no order false-positive)', () => {
    // spec: id, count, when, flag, note — front omits optional `note`
    const specWithOptional: OpenApiDocument = {
      components: {
        schemas: {
          Sample: {
            type: 'object',
            required: ['id', 'count', 'when', 'flag'],
            properties: {
              id: { type: 'string' },
              count: { type: 'integer' },
              when: { type: 'string' },
              flag: { type: 'boolean' },
              note: { type: 'string' }, // optional — front may omit it
            },
          },
        },
      },
    };
    const src = `export interface Sample {
      readonly id: string;
      readonly count: number;
      readonly when: string;
      readonly flag: boolean;
    }`;
    const violations = checkSchemaConformance({
      spec: specWithOptional,
      schemaName: 'Sample',
      sourceText: src,
      fileName: file,
    });
    expect(violations.some((v) => v.rule === 'field-order')).toBe(false);
  });

  it('flags field-order drift', () => {
    const src = `export interface Sample {
      readonly id: string;
      readonly count: number;
      readonly flag: boolean;   // swapped with when
      readonly when: string | null;
      readonly note: string | null;
    }`;
    expect(check(src)).toContainEqual(expect.objectContaining({ rule: 'field-order', field: '*' }));
  });

  it('field-order message shows spec order vs front order', () => {
    const src = `export interface Sample {
      readonly count: number;
      readonly id: string;
      readonly when: string | null;
      readonly flag: boolean;
      readonly note: string | null;
    }`;
    const violations = check(src);
    const v = violations.find((x) => x.rule === 'field-order');
    expect(v?.message).toContain('spec: [id, count');
    expect(v?.message).toContain('front: [count, id');
  });

  // The codebase keeps each string-union enum in its own file. A field typed as
  // an imported enum must follow the import to resolve to `string`, not default
  // an unresolved reference to `object` (which produced false type-family drift).
  it('resolves a string-union enum imported from a sibling file', () => {
    const enumSpec: OpenApiDocument = {
      components: {
        schemas: {
          Sample: { type: 'object', required: ['kind'], properties: { kind: { $ref: '#/x' } } },
          x: { enum: ['Alpha', 'Beta', 'Gamma'], type: 'string' },
        },
      },
    };
    const dtoFile = path.join(here, '__fixtures__/imported-enum/dto.ts');
    const violations = checkSchemaConformance({
      spec: enumSpec,
      schemaName: 'Sample',
      sourceText: readFileSync(dtoFile, 'utf8'),
      fileName: dtoFile,
    });
    expect(violations).toEqual([]);
  });

  // Merge/DTO aliases (`type PartyMergeRequest = MergeRequest<PartyId>`) forward
  // to a shared generic in another package. The oracle must follow the import,
  // flatten the generic's members, and bind the type parameter to the branded
  // argument so a field typed as the bare parameter resolves to its family.
  describe('cross-package generic-alias resolution', () => {
    const dtoFile = path.join(here, '__fixtures__/generic-alias/dto.ts');
    const checkAlias = (envelopeSpec: OpenApiDocument) =>
      checkSchemaConformance({
        spec: envelopeSpec,
        schemaName: 'OwnerEnvelopeResponse',
        sourceText: readFileSync(dtoFile, 'utf8'),
        fileName: dtoFile,
      });

    it('flattens a generic specialisation and binds the branded type argument', () => {
      const spec: OpenApiDocument = {
        components: {
          schemas: {
            OwnerEnvelopeResponse: {
              type: 'object',
              required: ['ownerId'],
              properties: {
                ownerId: { type: 'string' }, // satisfied by the bound branded `OwnerId`
                note: { type: ['null', 'string'] },
              },
            },
          },
        },
      };
      expect(checkAlias(spec)).toEqual([]);
    });

    it('still reports a real drift through the resolved generic', () => {
      const spec: OpenApiDocument = {
        components: {
          schemas: {
            OwnerEnvelopeResponse: {
              type: 'object',
              required: ['ownerId'],
              properties: {
                ownerId: { type: 'integer' }, // backend number vs front branded string
                note: { type: ['null', 'string'] },
              },
            },
          },
        },
      };
      expect(checkAlias(spec)).toContainEqual(
        expect.objectContaining({ rule: 'type-family', field: 'ownerId' })
      );
    });
  });
});

// A spec `anyOf` + discriminator (System.Text.Json polymorphism) verified
// branch-by-branch against a front `type X = A | B` union, paired by tag value.
describe('conformance oracle — discriminated unions', () => {
  const unionFile = '/virtual/union.ts';
  const unionSource = `
    export interface MoveDelta {
      readonly kind: 'move';
      readonly from: string;
      readonly to: string;
    }
    export interface DropDelta {
      readonly kind: 'drop';
      readonly target: string;
    }
    export type Delta = MoveDelta | DropDelta;
  `;

  const variant = (tag: string, props: Record<string, OpenApiSchema>, required: string[]) => ({
    type: 'object',
    required,
    properties: { kind: { enum: [tag], type: 'string' }, ...props },
  });

  /** A union spec with the given discriminator mapping (defaults to move+drop). */
  const unionSpec = (
    schemas: Record<string, OpenApiSchema>,
    mapping: Record<string, string>
  ): OpenApiDocument => ({
    components: {
      schemas: {
        Delta: {
          type: 'object',
          required: ['kind'],
          anyOf: Object.values(mapping).map(($ref) => ({ $ref })),
          discriminator: { propertyName: 'kind', mapping },
        },
        ...schemas,
      },
    },
  });

  const MOVE = '#/components/schemas/DeltaMove';
  const DROP = '#/components/schemas/DeltaDrop';
  const checkUnion = (spec: OpenApiDocument, typeName = 'Delta') =>
    checkSchemaConformance({
      spec,
      schemaName: 'Delta',
      sourceText: unionSource,
      fileName: unionFile,
      typeName,
    });

  const moveDrop = (from: OpenApiSchema = { type: 'string' }) =>
    unionSpec(
      {
        DeltaMove: variant('move', { from, to: { type: 'string' } }, ['from', 'to']),
        DeltaDrop: variant('drop', { target: { type: 'string' } }, ['target']),
      },
      { move: MOVE, drop: DROP }
    );

  it('passes when every branch is paired by tag and mirrors its variant schema', () => {
    expect(checkUnion(moveDrop())).toEqual([]);
  });

  it('reports a field drift inside a single branch, scoped to that variant', () => {
    // `from` is `integer` backend-side but `string` front-side, only in the move branch.
    expect(checkUnion(moveDrop({ type: 'integer' }))).toContainEqual(
      expect.objectContaining({ rule: 'type-family', schema: 'Delta#move', field: 'from' })
    );
  });

  it('flags a spec variant with no matching front union member', () => {
    const spec = unionSpec(
      {
        DeltaMove: variant('move', { from: { type: 'string' }, to: { type: 'string' } }, [
          'from',
          'to',
        ]),
        DeltaDrop: variant('drop', { target: { type: 'string' } }, ['target']),
        DeltaRename: variant('rename', { name: { type: 'string' } }, ['name']),
      },
      { move: MOVE, drop: DROP, rename: '#/components/schemas/DeltaRename' }
    );
    expect(checkUnion(spec)).toContainEqual(
      expect.objectContaining({
        rule: 'missing-variant',
        message: expect.stringContaining('rename'),
      })
    );
  });

  it('flags a front union member with no matching spec variant', () => {
    const spec = unionSpec(
      {
        DeltaMove: variant('move', { from: { type: 'string' }, to: { type: 'string' } }, [
          'from',
          'to',
        ]),
      },
      { move: MOVE } // front still has `drop`
    );
    expect(checkUnion(spec)).toContainEqual(
      expect.objectContaining({ rule: 'orphan-variant', message: expect.stringContaining('drop') })
    );
  });

  it('reports type-missing when the front type is not a union', () => {
    expect(checkUnion(moveDrop(), 'MoveDelta')).toContainEqual(
      expect.objectContaining({ rule: 'type-missing' })
    );
  });
});
