import type { ReactNode } from 'react';

import type { QueryMetadata } from '@granit/query-engine';
import type { useQueryEndpoint } from '@granit/react-query-engine';

import { FilterPresets } from './filter-presets';
import { GroupBySelector } from './group-by-selector';
import { SortSelector } from './sort-selector';

type QueryEndpoint<T> = ReturnType<typeof useQueryEndpoint<T>>;

/**
 * Shared filter/sort/group-by row used at the top of every list page driven by
 * the QueryEngine. Renders preset filters (when defined in meta), the sort
 * selector, the group-by selector (when meta exposes groupable fields), and a
 * right-aligned total-count label.
 *
 * Pages that wire a `SmartFilter` pass its `presets` + `onPresetToggle` via
 * the `presetState` slot — otherwise the bar drives presets directly through
 * the query endpoint.
 */
export function QueryControlBar<T>({
  meta,
  queryEndpoint,
  recordLabel,
  presetState,
  leading,
}: Readonly<{
  meta: QueryMetadata;
  queryEndpoint: QueryEndpoint<T>;
  recordLabel: string;
  presetState?: {
    presets: Readonly<Record<string, readonly string[]>>;
    onToggle: (group: string, names: readonly string[]) => void;
  };
  leading?: ReactNode;
}>) {
  const { isGrouped, params, query, groupedQuery, toggleSort, setGroupBy, setPresets } =
    queryEndpoint;
  const totalCount = isGrouped
    ? (groupedQuery.data?.totalCount ?? 0)
    : (query.data?.totalCount ?? 0);

  const presets = presetState?.presets ?? params.presets ?? {};
  const onPresetToggle = presetState?.onToggle ?? setPresets;

  return (
    <div data-slot="query-control-bar" className="flex flex-wrap items-center gap-2">
      {leading}
      {meta.presetFilterGroups.length > 0 && (
        <FilterPresets
          groups={meta.presetFilterGroups}
          activePresets={presets}
          onToggle={onPresetToggle}
        />
      )}
      <SortSelector columns={meta.columns} sort={params.sort} onToggleSort={toggleSort} />
      {meta.groupByFields.length > 0 && (
        <GroupBySelector
          fields={meta.groupByFields}
          columns={meta.columns}
          value={params.groupBy}
          onValueChange={setGroupBy}
        />
      )}
      <span className="ml-auto text-sm text-muted-foreground">
        {totalCount} {recordLabel}
      </span>
    </div>
  );
}
