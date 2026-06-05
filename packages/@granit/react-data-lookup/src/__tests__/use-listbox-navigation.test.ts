import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useListboxNavigation } from '../hooks/use-listbox-navigation';

import type { KeyboardEvent } from 'react';

/** Minimal KeyboardEvent stub carrying just what the handler reads. */
function keyEvent(key: string): KeyboardEvent {
  return { key, preventDefault: vi.fn() } as unknown as KeyboardEvent;
}

describe('useListboxNavigation', () => {
  it('wraps the highlight with ArrowDown / ArrowUp and tracks aria-activedescendant', () => {
    const onSelect = vi.fn();
    const { result } = renderHook(() => useListboxNavigation({ optionCount: 3, onSelect }));

    expect(result.current.activeIndex).toBe(-1);
    expect(result.current.activeDescendant).toBeUndefined();

    act(() => result.current.onKeyDown(keyEvent('ArrowDown')));
    expect(result.current.activeIndex).toBe(0);
    expect(result.current.activeDescendant).toBe(result.current.getOptionId(0));

    act(() => result.current.onKeyDown(keyEvent('ArrowUp')));
    expect(result.current.activeIndex).toBe(2); // wraps to the end
  });

  it('selects the active option on Enter and supports Home / End', () => {
    const onSelect = vi.fn();
    const { result } = renderHook(() => useListboxNavigation({ optionCount: 4, onSelect }));

    act(() => result.current.onKeyDown(keyEvent('End')));
    expect(result.current.activeIndex).toBe(3);

    act(() => result.current.onKeyDown(keyEvent('Enter')));
    expect(onSelect).toHaveBeenCalledWith(3);

    act(() => result.current.onKeyDown(keyEvent('Home')));
    expect(result.current.activeIndex).toBe(0);
  });

  it('fires onEscape and never selects when no option is active', () => {
    const onSelect = vi.fn();
    const onEscape = vi.fn();
    const { result } = renderHook(() =>
      useListboxNavigation({ optionCount: 2, onSelect, onEscape })
    );

    act(() => result.current.onKeyDown(keyEvent('Enter')));
    expect(onSelect).not.toHaveBeenCalled();

    act(() => result.current.onKeyDown(keyEvent('Escape')));
    expect(onEscape).toHaveBeenCalledTimes(1);
  });

  it('resets the highlight when the option count changes (new search results)', () => {
    const onSelect = vi.fn();
    const { result, rerender } = renderHook(
      ({ count }: { count: number }) => useListboxNavigation({ optionCount: count, onSelect }),
      { initialProps: { count: 3 } }
    );

    act(() => result.current.onKeyDown(keyEvent('ArrowDown')));
    expect(result.current.activeIndex).toBe(0);

    rerender({ count: 5 });
    expect(result.current.activeIndex).toBe(-1);
  });
});
