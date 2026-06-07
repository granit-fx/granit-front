'use client';

import { useCallback, useMemo, useState } from 'react';

import { useIntersectionSentinel } from '../hooks/use-intersection-sentinel';
import { useListboxNavigation } from '../hooks/use-listbox-navigation';
import { useLookup } from '../hooks/use-lookup';

import type { AxiosInstance } from '@granit/api-client';
import type { LookupDescriptor, LookupItem } from '@granit/data-lookup';
import type { KeyboardEvent, ReactElement } from 'react';

/** Render-prop signature for the SmartFilterBar typeahead. */
export interface LookupPickerRenderArgs {
  readonly search: string;
  readonly setSearch: (next: string) => void;
  /** Current value(s). Scalar for `Eq` (single), array for `In` (multi). */
  readonly value: unknown;
  readonly onChange: (next: unknown) => void;
  /** Whether the picker is in multi-select mode (e.g. the `In` filter operator). */
  readonly multi: boolean;
  /** Items matching the current search term — accumulated across pages. */
  readonly items: readonly LookupItem[];
  /** Total count across pages, or `null` for cursor-based sources. */
  readonly totalCount: number | null;
  readonly isLoading: boolean;
  readonly isFetchingNextPage: boolean;
  readonly hasNextPage: boolean;
  readonly fetchNextPage: () => void;
  readonly isError: boolean;
  readonly missingScopeKey: string | null;
  /** Whether `itemValue` is currently selected (handles both single and multi). */
  readonly isSelected: (itemValue: unknown) => boolean;
  /** Toggles `itemValue` in the selection (adds/removes for multi, sets/clears for single). */
  readonly toggle: (itemValue: unknown) => void;
  /** Callback ref for an end-of-list sentinel element — triggers `fetchNextPage`. */
  readonly sentinelRef: (node: Element | null) => void;
  // --- WAI-ARIA combobox plumbing ---
  readonly activeIndex: number;
  readonly setActiveIndex: (index: number) => void;
  readonly listboxId: string;
  readonly getOptionId: (index: number) => string;
  readonly activeDescendant: string | undefined;
  readonly onInputKeyDown: (event: KeyboardEvent) => void;
}

export interface LookupPickerProps {
  readonly descriptor: LookupDescriptor;
  readonly value: unknown;
  readonly onChange: (next: unknown) => void;
  /** Axios instance used by the underlying hook. Falls back to {@link DataLookupProvider}. */
  readonly client?: AxiosInstance;
  readonly scope?: Readonly<Record<string, string | null | undefined>>;
  readonly culture?: string;
  readonly basePath?: string;
  readonly pageSize?: number;
  /** Whether to allow multiple selections (for the `In` operator). */
  readonly multi?: boolean;
  readonly render: (args: LookupPickerRenderArgs) => ReactElement;
}

function asArray(value: unknown): readonly unknown[] {
  if (Array.isArray(value)) return value;
  if (value === null || value === undefined || value === '') return [];
  return [value];
}

/**
 * Lookup picker tailored for SmartFilterBar: an infinite-scroll variant of
 * {@link LookupSelect} that doesn't resolve the currently selected value
 * (filters already display the raw token) and supports multi-selection for the
 * `In` operator. `Eq` → scalar value; `In` → array value.
 *
 * Same Empty Scope Trap guarantees and ARIA plumbing as {@link LookupSelect}.
 */
export function LookupPicker(props: LookupPickerProps): ReactElement {
  const {
    descriptor,
    value,
    onChange,
    client,
    scope,
    culture,
    basePath,
    pageSize,
    multi = false,
    render,
  } = props;

  const [search, setSearch] = useState('');

  const query = useLookup(descriptor, { search, scope, pageSize }, { client, basePath, culture });
  const { items, fetchNextPage, hasNextPage, isFetchingNextPage } = query;

  const selectedValues = useMemo(() => asArray(value), [value]);

  const isSelected = useCallback(
    (itemValue: unknown) => selectedValues.includes(itemValue),
    [selectedValues]
  );

  const toggle = useCallback(
    (itemValue: unknown) => {
      if (!multi) {
        onChange(isSelected(itemValue) ? null : itemValue);
        return;
      }
      const next = isSelected(itemValue)
        ? selectedValues.filter((v) => v !== itemValue)
        : [...selectedValues, itemValue];
      onChange(next);
    },
    [multi, isSelected, selectedValues, onChange]
  );

  const onSelectIndex = useCallback(
    (index: number) => {
      const item = items[index];
      if (item !== undefined) toggle(item.value);
    },
    [items, toggle]
  );

  const nav = useListboxNavigation({ optionCount: items.length, onSelect: onSelectIndex });

  const sentinelRef = useIntersectionSentinel({
    enabled: hasNextPage && !isFetchingNextPage,
    onIntersect: fetchNextPage,
  });

  return render({
    search,
    setSearch,
    value,
    onChange,
    multi,
    items,
    totalCount: query.totalCount,
    isLoading: query.isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    isError: query.isError,
    missingScopeKey: query.missingScopeKey,
    isSelected,
    toggle,
    sentinelRef,
    activeIndex: nav.activeIndex,
    setActiveIndex: nav.setActiveIndex,
    listboxId: nav.listboxId,
    getOptionId: nav.getOptionId,
    activeDescendant: nav.activeDescendant,
    onInputKeyDown: nav.onKeyDown,
  });
}
