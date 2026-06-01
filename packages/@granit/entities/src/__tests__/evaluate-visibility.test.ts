import { describe, expect, it } from 'vitest';

import { evaluateVisibility } from '../helpers/evaluate-visibility';

import type { VisibilityCondition } from '../types/visibility';

const cond = (
  field: string,
  op: VisibilityCondition['op'],
  value?: unknown
): VisibilityCondition => ({ field, op, value });

describe('evaluateVisibility — Eq / NotEq', () => {
  it('Eq is true when actual strictly equals expected', () => {
    expect(evaluateVisibility(cond('Status', 'Eq', 'Active'), { Status: 'Active' })).toBe(true);
  });

  it('Eq is false on type mismatch (no coercion)', () => {
    expect(evaluateVisibility(cond('Count', 'Eq', '1'), { Count: 1 })).toBe(false);
  });

  it('Eq distinguishes null from undefined', () => {
    expect(evaluateVisibility(cond('X', 'Eq', null), { X: undefined })).toBe(false);
    expect(evaluateVisibility(cond('X', 'Eq', null), { X: null })).toBe(true);
  });

  it('NotEq mirrors Eq', () => {
    expect(evaluateVisibility(cond('Status', 'NotEq', 'Draft'), { Status: 'Active' })).toBe(true);
    expect(evaluateVisibility(cond('Status', 'NotEq', 'Active'), { Status: 'Active' })).toBe(false);
  });
});

describe('evaluateVisibility — In / NotIn', () => {
  it('In is true when actual is in the array', () => {
    const c = cond('Status', 'In', ['Active', 'Pending']);
    expect(evaluateVisibility(c, { Status: 'Pending' })).toBe(true);
  });

  it('In is false when actual is missing', () => {
    const c = cond('Status', 'In', ['Active', 'Pending']);
    expect(evaluateVisibility(c, { Status: 'Closed' })).toBe(false);
  });

  it('NotIn mirrors In', () => {
    const c = cond('Status', 'NotIn', ['Closed', 'Archived']);
    expect(evaluateVisibility(c, { Status: 'Active' })).toBe(true);
    expect(evaluateVisibility(c, { Status: 'Closed' })).toBe(false);
  });

  it('throws when the value is not an array', () => {
    expect(() =>
      evaluateVisibility(cond('Status', 'In', 'not-an-array'), { Status: 'Active' })
    ).toThrow(/requires an array value/);
    expect(() => evaluateVisibility(cond('Status', 'NotIn', null), { Status: 'Active' })).toThrow(
      /requires an array value/
    );
  });
});

describe('evaluateVisibility — Gt / Lt', () => {
  it('Gt compares numbers strictly', () => {
    expect(evaluateVisibility(cond('Amount', 'Gt', 100), { Amount: 150 })).toBe(true);
    expect(evaluateVisibility(cond('Amount', 'Gt', 100), { Amount: 100 })).toBe(false);
  });

  it('Lt compares numbers strictly', () => {
    expect(evaluateVisibility(cond('Amount', 'Lt', 100), { Amount: 50 })).toBe(true);
    expect(evaluateVisibility(cond('Amount', 'Lt', 100), { Amount: 100 })).toBe(false);
  });

  it('Gt/Lt also accept strings (lexicographic) and bigints', () => {
    expect(evaluateVisibility(cond('Code', 'Gt', 'A'), { Code: 'B' })).toBe(true);
    expect(evaluateVisibility(cond('N', 'Gt', 10n), { N: 11n })).toBe(true);
  });

  it('Gt/Lt return false when either side is not comparable', () => {
    expect(evaluateVisibility(cond('Amount', 'Gt', 100), { Amount: undefined })).toBe(false);
    expect(evaluateVisibility(cond('Amount', 'Gt', null), { Amount: 100 })).toBe(false);
    expect(evaluateVisibility(cond('Amount', 'Gt', { x: 1 }), { Amount: 100 })).toBe(false);
  });
});

describe('evaluateVisibility — IsNull / IsNotNull', () => {
  it('IsNull treats null and undefined the same', () => {
    expect(evaluateVisibility(cond('X', 'IsNull'), { X: null })).toBe(true);
    expect(evaluateVisibility(cond('X', 'IsNull'), { X: undefined })).toBe(true);
    expect(evaluateVisibility(cond('X', 'IsNull'), {})).toBe(true);
  });

  it('IsNull is false for any defined value, including the empty string and 0', () => {
    expect(evaluateVisibility(cond('X', 'IsNull'), { X: '' })).toBe(false);
    expect(evaluateVisibility(cond('X', 'IsNull'), { X: 0 })).toBe(false);
    expect(evaluateVisibility(cond('X', 'IsNull'), { X: false })).toBe(false);
  });

  it('IsNotNull mirrors IsNull', () => {
    expect(evaluateVisibility(cond('X', 'IsNotNull'), { X: 'hello' })).toBe(true);
    expect(evaluateVisibility(cond('X', 'IsNotNull'), { X: null })).toBe(false);
    expect(evaluateVisibility(cond('X', 'IsNotNull'), {})).toBe(false);
  });

  it('IsNull / IsNotNull ignore the condition value', () => {
    expect(evaluateVisibility(cond('X', 'IsNull', 'ignored'), { X: null })).toBe(true);
    expect(evaluateVisibility(cond('X', 'IsNotNull', 42), { X: null })).toBe(false);
  });
});

describe('evaluateVisibility — missing field', () => {
  it('reads a missing key as undefined', () => {
    expect(evaluateVisibility(cond('Missing', 'IsNull'), {})).toBe(true);
    expect(evaluateVisibility(cond('Missing', 'Eq', 'x'), {})).toBe(false);
  });
});
