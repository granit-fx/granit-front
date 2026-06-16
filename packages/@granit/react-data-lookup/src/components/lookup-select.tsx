'use client';

import { useCallback, useState } from 'react';

import { useIntersectionSentinel } from '../hooks/use-intersection-sentinel';
import { useListboxNavigation } from '../hooks/use-listbox-navigation';
import { useLookup } from '../hooks/use-lookup';
import { useLookupResolve } from '../hooks/use-lookup-resolve';

import type { AxiosInstance } from '@granit/api-client';
import type { LookupDescriptor, LookupItemResponse } from '@granit/data-lookup';
import type { KeyboardEvent, ReactElement } from 'react';

/** Render-prop signature for custom UIs. Callers bring their own combobox primitive. */
export interface LookupSelectRenderArgs {
  /** Current search term (controlled). */
  readonly search: string;
  /** Setter for the search term (debounced internally before it hits the network). */
  readonly setSearch: (next: string) => void;
  /** Current selected value (controlled). */
  readonly value: unknown;
  /** Setter for the selected value. Accepts `null` to clear. */
  readonly onChange: (next: unknown) => void;
  /** Currently selected item, resolved via the /resolve endpoint. */
  readonly selectedItem: LookupItemResponse | null;
  /** Items for the dropdown — accumulated across every fetched page. */
  readonly items: readonly LookupItemResponse[];
  /** Total count across pages, or `null` for cursor-based sources. */
  readonly totalCount: number | null;
  /** First page is loading (no data yet). */
  readonly isLoading: boolean;
  /** A subsequent page is being fetched (infinite-scroll). */
  readonly isFetchingNextPage: boolean;
  /** Whether another page can be fetched. */
  readonly hasNextPage: boolean;
  /** Fetches the next page (offset / cursor handled transparently). */
  readonly fetchNextPage: () => void;
  /** The search query errored. */
  readonly isError: boolean;
  /** When non-null, the picker must be disabled and this message shown. */
  readonly missingScopeKey: string | null;
  /** Callback ref for an end-of-list sentinel element — triggers `fetchNextPage` on view. */
  readonly sentinelRef: (node: Element | null) => void;
  // --- WAI-ARIA combobox plumbing (markup stays app-owned) ---
  /** Index of the highlighted option, or `-1`. */
  readonly activeIndex: number;
  /** Imperatively highlight an option (e.g. on pointer hover). */
  readonly setActiveIndex: (index: number) => void;
  /** Id for the `role="listbox"` element. */
  readonly listboxId: string;
  /** Id for the `role="option"` at `index`. */
  readonly getOptionId: (index: number) => string;
  /** `aria-activedescendant` for the combobox input. */
  readonly activeDescendant: string | undefined;
  /** Keyboard handler for the combobox input (Arrow / Enter / Escape / Home / End). */
  readonly onInputKeyDown: (event: KeyboardEvent) => void;
}

export interface LookupSelectProps {
  /** Descriptor emitted by the backend (or built inline for ad-hoc sources). */
  readonly descriptor: LookupDescriptor;
  /** Currently selected value (controlled). */
  readonly value: unknown;
  /** Called with the new value when the user selects an item (or `null` to clear). */
  readonly onChange: (next: unknown) => void;
  /** Axios instance used by the underlying hooks. Falls back to {@link DataLookupProvider}. */
  readonly client?: AxiosInstance;
  /** Map of `<scope key> → <form field value>` resolved at render time. */
  readonly scope?: Readonly<Record<string, string | null | undefined>>;
  /** Current UI culture — passed to both hooks so caches are per-language. */
  readonly culture?: string;
  /** Override the base path. Defaults to `/lookups`. */
  readonly basePath?: string;
  /** Page size passed to the search query. Default: `25`. */
  readonly pageSize?: number;
  /** Render prop. Provides the headless state; consumers wrap it in their combobox UI. */
  readonly render: (args: LookupSelectRenderArgs) => ReactElement;
}

/**
 * Headless combobox-style select backed by {@link useLookup} (infinite-scroll)
 * and {@link useLookupResolve} (label rehydration). Intentionally
 * presentation-agnostic: callers provide a `render` prop that plugs the returned
 * state into their UI kit (Radix, HeadlessUI, shadcn, custom CSS…).
 *
 * The render args carry the full WAI-ARIA combobox plumbing
 * (`activeDescendant`, option ids, keyboard handler) and an infinite-scroll
 * `sentinelRef`, so an app can build an accessible, paginated combobox without
 * re-implementing the data/keyboard logic.
 *
 * **Empty Scope Trap** — when the descriptor declares `scopeKeys` and the
 * provided `scope` is missing a value, the search query is disabled and
 * `missingScopeKey` is set to the first missing key. The UI should render a
 * placeholder like "Select a tenant first" rather than an open picker.
 */
export function LookupSelect(props: LookupSelectProps): ReactElement {
  const { descriptor, value, onChange, client, scope, culture, basePath, pageSize, render } = props;

  const [search, setSearch] = useState('');

  const searchQuery = useLookup(
    descriptor,
    { search, scope, pageSize },
    { client, basePath, culture }
  );

  const resolveQuery = useLookupResolve(descriptor, value, { client, basePath, culture });

  const { items, fetchNextPage, hasNextPage, isFetchingNextPage } = searchQuery;

  const onSelectIndex = useCallback(
    (index: number) => {
      const item = items[index];
      if (item !== undefined) onChange(item.value);
    },
    [items, onChange]
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
    selectedItem: resolveQuery.data ?? null,
    items,
    totalCount: searchQuery.totalCount,
    isLoading: searchQuery.isLoading || resolveQuery.isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    isError: searchQuery.isError,
    missingScopeKey: searchQuery.missingScopeKey,
    sentinelRef,
    activeIndex: nav.activeIndex,
    setActiveIndex: nav.setActiveIndex,
    listboxId: nav.listboxId,
    getOptionId: nav.getOptionId,
    activeDescendant: nav.activeDescendant,
    onInputKeyDown: nav.onKeyDown,
  });
}
