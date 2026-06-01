import { useMemo, useState } from 'react';

import { useLookup } from '../hooks/use-lookup';

import type { AxiosInstance } from '@granit/api-client';
import type { LookupDescriptor, LookupItem } from '@granit/data-lookup';
import type { ReactElement } from 'react';

/** Render-prop signature for the SmartFilterBar typeahead. */
export interface LookupPickerRenderArgs {
  readonly search: string;
  readonly setSearch: (next: string) => void;
  /** Current value(s). String for `Eq`, array for `In`. */
  readonly value: unknown;
  readonly onChange: (next: unknown) => void;
  /** Whether the picker is in multi-select mode (e.g., `In` filter operator). */
  readonly multi: boolean;
  /** Items matching the current search term. */
  readonly items: readonly LookupItem[];
  readonly isLoading: boolean;
  readonly missingScopeKey: string | null;
}

export interface LookupPickerProps {
  readonly descriptor: LookupDescriptor;
  readonly value: unknown;
  readonly onChange: (next: unknown) => void;
  readonly client: AxiosInstance;
  readonly scope?: Readonly<Record<string, string | null | undefined>>;
  readonly culture?: string;
  readonly basePath?: string;
  readonly pageSize?: number;
  /** Whether to allow multiple selections (for the `In` operator). */
  readonly multi?: boolean;
  readonly render: (args: LookupPickerRenderArgs) => ReactElement;
}

/**
 * Lookup picker tailored for SmartFilterBar: a stripped-down variant of
 * {@link LookupSelect} that doesn't resolve the currently selected value
 * (filters already display the raw value), and supports multi-selection
 * for the `In` operator.
 *
 * Same Empty Scope Trap guarantees as {@link LookupSelect}.
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
    pageSize = 25,
    multi = false,
    render,
  } = props;

  const [search, setSearch] = useState('');

  const query = useLookup(
    descriptor,
    { search, page: 1, pageSize, scope },
    { client, basePath, culture }
  );

  const items: readonly LookupItem[] = useMemo(() => query.data?.items ?? [], [query.data]);

  return render({
    search,
    setSearch,
    value,
    onChange,
    multi,
    items,
    isLoading: query.isLoading,
    missingScopeKey: query.missingScopeKey,
  });
}
