import { describe, expect, it } from 'vitest';

import { checkSchemaConformance } from '../conformance';

import type { OpenApiDocument } from '../conformance';

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
});
