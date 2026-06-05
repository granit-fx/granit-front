'use client';

import { useCallback, useEffect, useId, useState } from 'react';

import type { KeyboardEvent } from 'react';

/** Options for {@link useListboxNavigation}. */
export interface UseListboxNavigationOptions {
  /** Number of options currently rendered in the listbox. */
  readonly optionCount: number;
  /** Invoked with the active index when the user presses Enter. */
  readonly onSelect: (index: number) => void;
  /** Optional callback fired on Escape (e.g. to close the popover). */
  readonly onEscape?: () => void;
}

/** State and ARIA wiring returned by {@link useListboxNavigation}. */
export interface ListboxNavigation {
  /** Currently highlighted option index, or `-1` when none. */
  readonly activeIndex: number;
  /** Imperatively set the active index (e.g. on pointer hover). */
  readonly setActiveIndex: (index: number) => void;
  /** Stable id for the listbox element — wire to `role="listbox"` and `aria-controls`. */
  readonly listboxId: string;
  /** Stable id for the option at `index` — wire to `role="option"` and `aria-activedescendant`. */
  readonly getOptionId: (index: number) => string;
  /** `aria-activedescendant` value for the combobox input (the active option id, or `undefined`). */
  readonly activeDescendant: string | undefined;
  /** Keyboard handler to attach to the combobox input (Arrow keys / Enter / Escape / Home / End). */
  readonly onKeyDown: (event: KeyboardEvent) => void;
}

/**
 * Headless keyboard navigation + ARIA wiring for a combobox listbox. Keeps the
 * markup app-owned (per the framework's unstyled-first convention) while
 * supplying the WAI-ARIA combobox plumbing — `aria-activedescendant`, stable
 * option ids, and Arrow/Enter/Escape/Home/End handling.
 *
 * The active index is clamped and reset to `-1` whenever the option count
 * changes (e.g. after a new search), so a stale highlight never points past the
 * end of the list.
 */
export function useListboxNavigation(options: UseListboxNavigationOptions): ListboxNavigation {
  const { optionCount, onSelect, onEscape } = options;
  const baseId = useId();
  const [activeIndex, setActiveIndexState] = useState(-1);

  // Reset the highlight when the result set changes — a new search must not
  // leave the cursor pointing at a row that no longer exists.
  useEffect(() => {
    setActiveIndexState(-1);
  }, [optionCount]);

  const setActiveIndex = useCallback(
    (index: number) => {
      if (optionCount === 0) {
        setActiveIndexState(-1);
        return;
      }
      setActiveIndexState(Math.max(0, Math.min(index, optionCount - 1)));
    },
    [optionCount]
  );

  const onKeyDown = useCallback(
    (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setActiveIndexState((prev) => (optionCount === 0 ? -1 : (prev + 1) % optionCount));
          break;
        case 'ArrowUp':
          event.preventDefault();
          setActiveIndexState((prev) =>
            optionCount === 0 ? -1 : (prev - 1 + optionCount) % optionCount
          );
          break;
        case 'Home':
          if (optionCount > 0) {
            event.preventDefault();
            setActiveIndexState(0);
          }
          break;
        case 'End':
          if (optionCount > 0) {
            event.preventDefault();
            setActiveIndexState(optionCount - 1);
          }
          break;
        case 'Enter':
          if (activeIndex >= 0 && activeIndex < optionCount) {
            event.preventDefault();
            onSelect(activeIndex);
          }
          break;
        case 'Escape':
          onEscape?.();
          break;
        default:
          break;
      }
    },
    [activeIndex, optionCount, onSelect, onEscape]
  );

  const getOptionId = useCallback((index: number) => `${baseId}-opt-${index}`, [baseId]);

  return {
    activeIndex,
    setActiveIndex,
    listboxId: `${baseId}-listbox`,
    getOptionId,
    activeDescendant: activeIndex >= 0 ? getOptionId(activeIndex) : undefined,
    onKeyDown,
  };
}
