import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useFieldChoices } from '../hooks/use-field-choices';

import type { FieldConflict } from '@granit/entity-merge';

const conflicts: readonly FieldConflict[] = [
  { fieldPath: 'Name', survivorValue: 'A', loserValue: 'B', default: 'Survivor' },
  { fieldPath: 'Tax', survivorValue: null, loserValue: 'X', default: 'Loser' },
];

describe('useFieldChoices', () => {
  it('seeds the recommended defaults from the conflicts', () => {
    const { result } = renderHook(() => useFieldChoices(conflicts));
    expect(result.current.choices).toEqual({ Name: 'Survivor', Tax: 'Loser' });
  });

  it('resolves the effective winner, override or default', () => {
    const { result } = renderHook(() => useFieldChoices(conflicts));
    expect(result.current.winnerFor(conflicts[0]!)).toBe('Survivor');
    act(() => result.current.setChoice('Name', 'Loser'));
    expect(result.current.winnerFor(conflicts[0]!)).toBe('Loser');
    expect(result.current.choices).toEqual({ Name: 'Loser', Tax: 'Loser' });
  });

  it('resets overrides so winnerFor falls back to defaults', () => {
    const { result } = renderHook(() => useFieldChoices(conflicts));
    act(() => result.current.setChoice('Name', 'Loser'));
    expect(result.current.choices.Name).toBe('Loser');
    act(() => result.current.reset());
    expect(result.current.choices).toEqual({});
    expect(result.current.winnerFor(conflicts[0]!)).toBe('Survivor');
  });
});
