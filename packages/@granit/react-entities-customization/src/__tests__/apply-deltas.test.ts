import { describe, expect, it } from 'vitest';

import {
  applyDeltas,
  moveFieldDown,
  moveFieldUp,
  setFieldGroup,
  toggleFieldHidden,
  type SchemaField,
} from '../layout/apply-deltas.js';

import type { LayoutDelta } from '@granit/entities-customization';

const fields: readonly SchemaField[] = [
  { name: 'name', defaultGroup: 'general' },
  { name: 'amount', defaultGroup: 'pricing' },
  { name: 'currency', defaultGroup: 'pricing' },
  { name: 'internalNotes' },
];

describe('applyDeltas', () => {
  it('returns the schema order when no deltas apply', () => {
    expect(applyDeltas(fields, []).map((f) => f.name)).toEqual([
      'name',
      'amount',
      'currency',
      'internalNotes',
    ]);
  });

  it('hides a field via Hide delta', () => {
    const result = applyDeltas(fields, [{ kind: 'Hide', fieldName: 'internalNotes' }]);
    expect(result.find((f) => f.name === 'internalNotes')?.hidden).toBe(true);
  });

  it('reassigns the group via Regroup delta', () => {
    const result = applyDeltas(fields, [
      { kind: 'Regroup', fieldName: 'amount', groupKey: 'finance' },
    ]);
    expect(result.find((f) => f.name === 'amount')?.group).toBe('finance');
  });

  it('moves a field before an anchor via Reorder.beforeFieldName', () => {
    const result = applyDeltas(fields, [
      { kind: 'Reorder', fieldName: 'currency', beforeFieldName: 'amount' },
    ]);
    expect(result.map((f) => f.name)).toEqual(['name', 'currency', 'amount', 'internalNotes']);
  });

  it('moves a field after an anchor via Reorder.afterFieldName', () => {
    const result = applyDeltas(fields, [
      { kind: 'Reorder', fieldName: 'name', afterFieldName: 'currency' },
    ]);
    expect(result.map((f) => f.name)).toEqual(['amount', 'currency', 'name', 'internalNotes']);
  });

  it('ignores Reorder when the anchor does not exist', () => {
    const result = applyDeltas(fields, [
      { kind: 'Reorder', fieldName: 'name', beforeFieldName: 'unknownField' },
    ]);
    expect(result.map((f) => f.name)).toEqual(['name', 'amount', 'currency', 'internalNotes']);
  });

  it('ignores deltas targeting unknown fields', () => {
    const result = applyDeltas(fields, [{ kind: 'Hide', fieldName: 'mystery' }]);
    expect(result.every((f) => !f.hidden)).toBe(true);
  });

  it('applies deltas in order — later wins for the same field/kind', () => {
    const deltas: readonly LayoutDelta[] = [
      { kind: 'Regroup', fieldName: 'amount', groupKey: 'finance' },
      { kind: 'Regroup', fieldName: 'amount', groupKey: 'totals' },
    ];
    expect(applyDeltas(fields, deltas).find((f) => f.name === 'amount')?.group).toBe('totals');
  });
});

describe('moveFieldUp / moveFieldDown', () => {
  it('moveFieldUp on the first row is a no-op', () => {
    expect(moveFieldUp(fields, [], 'name')).toEqual([]);
  });

  it('moveFieldDown on the last row is a no-op', () => {
    expect(moveFieldDown(fields, [], 'internalNotes')).toEqual([]);
  });

  it('moveFieldUp produces a Reorder.beforeFieldName delta', () => {
    const next = moveFieldUp(fields, [], 'amount');
    expect(applyDeltas(fields, next).map((f) => f.name)).toEqual([
      'amount',
      'name',
      'currency',
      'internalNotes',
    ]);
  });

  it('moveFieldDown produces a Reorder.afterFieldName delta', () => {
    const next = moveFieldDown(fields, [], 'amount');
    expect(applyDeltas(fields, next).map((f) => f.name)).toEqual([
      'name',
      'currency',
      'amount',
      'internalNotes',
    ]);
  });
});

describe('toggleFieldHidden', () => {
  it('appends a Hide delta when the field is currently visible', () => {
    const next = toggleFieldHidden(fields, [], 'amount');
    expect(next).toEqual([{ kind: 'Hide', fieldName: 'amount' }]);
  });

  it('strips Hide deltas when the field is currently hidden', () => {
    const initial: readonly LayoutDelta[] = [{ kind: 'Hide', fieldName: 'amount' }];
    expect(toggleFieldHidden(fields, initial, 'amount')).toEqual([]);
  });
});

describe('setFieldGroup', () => {
  it('replaces any prior Regroup delta for the field', () => {
    const initial: readonly LayoutDelta[] = [
      { kind: 'Regroup', fieldName: 'amount', groupKey: 'old' },
    ];
    expect(setFieldGroup(initial, 'amount', 'new')).toEqual([
      { kind: 'Regroup', fieldName: 'amount', groupKey: 'new' },
    ]);
  });

  it('clears the group when groupKey is empty', () => {
    const initial: readonly LayoutDelta[] = [
      { kind: 'Regroup', fieldName: 'amount', groupKey: 'old' },
    ];
    expect(setFieldGroup(initial, 'amount', '')).toEqual([]);
  });
});
