import { useMemo, useState } from 'react';

import { useLookup } from '../hooks/use-lookup';
import { useLookupResolve } from '../hooks/use-lookup-resolve';

import type { AxiosInstance } from '@granit/api-client';
import type { LookupDescriptor, LookupItem } from '@granit/data-lookup';
import type { ReactElement } from 'react';

/** Render-prop signature for custom UIs. Callers bring their own combobox primitive. */
export interface LookupSelectRenderArgs {
  /** Current search term (controlled). */
  readonly search: string;
  /** Setter for the search term. */
  readonly setSearch: (next: string) => void;
  /** Current selected value (controlled). */
  readonly value: unknown;
  /** Setter for the selected value. Accepts `null` to clear. */
  readonly onChange: (next: unknown) => void;
  /** Currently selected item, resolved via the /resolve endpoint. */
  readonly selectedItem: LookupItem | null;
  /** Items for the dropdown (current page). */
  readonly items: readonly LookupItem[];
  /** Loading state for the search query. */
  readonly isLoading: boolean;
  /** When non-null, the picker must be disabled and this message shown. */
  readonly missingScopeKey: string | null;
}

export interface LookupSelectProps {
  /** Descriptor emitted by the backend (or built inline for ad-hoc sources). */
  readonly descriptor: LookupDescriptor;
  /** Currently selected value (controlled). */
  readonly value: unknown;
  /** Called with the new value when the user selects an item (or `null` to clear). */
  readonly onChange: (next: unknown) => void;
  /** Axios instance used by the underlying hooks. */
  readonly client: AxiosInstance;
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
 * Headless combobox-style select backed by {@link useLookup} and
 * {@link useLookupResolve}. Intentionally presentation-agnostic: callers
 * provide a `render` prop that plugs the returned state into their UI kit
 * (Radix, HeadlessUI, Mantine, custom CSS...).
 *
 * **Empty Scope Trap** — when the descriptor declares `scopeKeys` and the
 * provided `scope` is missing a value, the search query is disabled and
 * `missingScopeKey` is set to the first missing key. The UI is expected to
 * render a placeholder like "Select a tenant first" rather than an open
 * picker with full-table-scan results.
 */
export function LookupSelect(props: LookupSelectProps): ReactElement {
  const {
    descriptor,
    value,
    onChange,
    client,
    scope,
    culture,
    basePath,
    pageSize = 25,
    render,
  } = props;

  const [search, setSearch] = useState('');

  const searchQuery = useLookup(
    descriptor,
    { search, page: 1, pageSize, scope },
    { client, basePath, culture }
  );

  const resolveQuery = useLookupResolve(descriptor, value, {
    client,
    basePath,
    culture,
  });

  const items: readonly LookupItem[] = useMemo(
    () => searchQuery.data?.items ?? [],
    [searchQuery.data]
  );

  return render({
    search,
    setSearch,
    value,
    onChange,
    selectedItem: resolveQuery.data ?? null,
    items,
    isLoading: searchQuery.isLoading || resolveQuery.isLoading,
    missingScopeKey: searchQuery.missingScopeKey,
  });
}
