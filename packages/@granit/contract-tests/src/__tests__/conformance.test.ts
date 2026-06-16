import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { checkSchemaConformance } from '../conformance';

import type { OpenApiDocument } from '../conformance';

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
});
