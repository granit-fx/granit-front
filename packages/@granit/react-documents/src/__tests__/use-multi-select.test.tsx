import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useMultiSelect } from '../hooks/use-multi-select';

const IDS = ['a', 'b', 'c', 'd', 'e'] as const;

describe('useMultiSelect', () => {
  it('toggles ids on and off and tracks them as the anchor', () => {
    const { result } = renderHook(({ ids }) => useMultiSelect(ids), {
      initialProps: { ids: IDS as readonly string[] },
    });

    act(() => result.current.toggle('b'));
    expect(result.current.isSelected('b')).toBe(true);

    act(() => result.current.toggle('b'));
    expect(result.current.isSelected('b')).toBe(false);
  });

  it('select is idempotent and updates the anchor for subsequent ranges', () => {
    const { result } = renderHook(({ ids }) => useMultiSelect(ids), {
      initialProps: { ids: IDS as readonly string[] },
    });

    act(() => result.current.select('b'));
    act(() => result.current.select('b'));
    expect([...result.current.selected]).toEqual(['b']);

    act(() => result.current.selectRange('d'));
    expect([...result.current.selected]).toEqual(['b', 'c', 'd']);
  });

  it('selectOnly replaces the current selection and resets the anchor', () => {
    const { result } = renderHook(({ ids }) => useMultiSelect(ids), {
      initialProps: { ids: IDS as readonly string[] },
    });

    act(() => result.current.selectAll(['a', 'b']));
    act(() => result.current.selectOnly('c'));
    expect([...result.current.selected]).toEqual(['c']);
  });

  it('selectRange falls back to selecting the click target when no anchor is set', () => {
    const { result } = renderHook(({ ids }) => useMultiSelect(ids), {
      initialProps: { ids: IDS as readonly string[] },
    });

    act(() => result.current.selectRange('c'));
    expect([...result.current.selected]).toEqual(['c']);
  });

  it('selectRange falls back when the anchor is no longer in the listing', () => {
    const { result, rerender } = renderHook(({ ids }) => useMultiSelect(ids), {
      initialProps: { ids: IDS as readonly string[] },
    });

    act(() => result.current.select('b'));
    rerender({ ids: ['x', 'y', 'z'] });

    act(() => result.current.selectRange('y'));
    expect([...result.current.selected]).toEqual(['y']);
  });

  it('selectRange is a no-op when the click target is no longer in the listing', () => {
    const { result, rerender } = renderHook(({ ids }) => useMultiSelect(ids), {
      initialProps: { ids: IDS as readonly string[] },
    });

    act(() => result.current.select('a'));
    rerender({ ids: ['a', 'b', 'c'] });
    act(() => result.current.selectRange('missing'));
    expect([...result.current.selected]).toEqual(['a']);
  });

  it('selectRange handles ranges in both directions', () => {
    const { result } = renderHook(({ ids }) => useMultiSelect(ids), {
      initialProps: { ids: IDS as readonly string[] },
    });

    act(() => result.current.select('d'));
    act(() => result.current.selectRange('b'));
    expect([...result.current.selected]).toEqual(['b', 'c', 'd']);

    act(() => result.current.select('a'));
    act(() => result.current.selectRange('c'));
    expect([...result.current.selected]).toEqual(['a', 'b', 'c']);
  });

  it('selectAll sets the anchor to the last id, and to null for an empty list', () => {
    const { result } = renderHook(({ ids }) => useMultiSelect(ids), {
      initialProps: { ids: IDS as readonly string[] },
    });

    act(() => result.current.selectAll(['a', 'b', 'c']));
    expect([...result.current.selected]).toEqual(['a', 'b', 'c']);
    act(() => result.current.selectRange('e'));
    expect([...result.current.selected]).toEqual(['c', 'd', 'e']);

    act(() => result.current.selectAll([]));
    expect([...result.current.selected]).toEqual([]);
    // Anchor reset to null — next range click selects only the target.
    act(() => result.current.selectRange('b'));
    expect([...result.current.selected]).toEqual(['b']);
  });

  it('clear empties the selection and resets the anchor', () => {
    const { result } = renderHook(({ ids }) => useMultiSelect(ids), {
      initialProps: { ids: IDS as readonly string[] },
    });

    act(() => result.current.selectAll(['a', 'b']));
    act(() => result.current.clear());
    expect([...result.current.selected]).toEqual([]);
    act(() => result.current.selectRange('d'));
    expect([...result.current.selected]).toEqual(['d']);
  });

  it('remove drops the requested ids and leaves the rest', () => {
    const { result } = renderHook(({ ids }) => useMultiSelect(ids), {
      initialProps: { ids: IDS as readonly string[] },
    });

    act(() => result.current.selectAll(['a', 'b', 'c']));
    act(() => result.current.remove(['a', 'c']));
    expect([...result.current.selected]).toEqual(['b']);
  });

  it('prunes ids from the selection when they leave the listing, but keeps the set stable otherwise', () => {
    const { result, rerender } = renderHook(({ ids }) => useMultiSelect(ids), {
      initialProps: { ids: IDS as readonly string[] },
    });

    act(() => result.current.selectAll(['a', 'b']));
    const before = result.current.selected;

    // Re-render with the same listing — selection set must be the same reference
    // (cheap React Query Engine prop comparisons rely on this).
    rerender({ ids: IDS as readonly string[] });
    expect(result.current.selected).toBe(before);

    rerender({ ids: ['b', 'c'] });
    expect([...result.current.selected]).toEqual(['b']);
  });
});
