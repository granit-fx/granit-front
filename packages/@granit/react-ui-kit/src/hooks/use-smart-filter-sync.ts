import { useCallback, useEffect } from 'react';

import type { FilterEntry } from '@granit/query-engine';
import type { useQueryEndpoint, useQueryMeta, useSmartFilter } from '@granit/react-query-engine';

type SmartFilter = ReturnType<typeof useSmartFilter>;
type QueryEndpoint = ReturnType<typeof useQueryEndpoint>;
type QueryMeta = ReturnType<typeof useQueryMeta>;

const NO_BASE_FILTERS: readonly FilterEntry[] = [];

/**
 * Syncs smartFilter state (filters, search, presets, quickFilters) to a
 * queryEndpoint and provides a bidirectional preset toggle handler.
 *
 * `baseFilters` are always-applied, non-user-editable filters (e.g. scoping a
 * child grid to a parent id). They are prepended to the user's smart filters on
 * every sync. Pass a stable (memoized) array.
 */
export function useSmartFilterSync(
  smartFilter: SmartFilter,
  queryEndpoint: QueryEndpoint,
  meta: QueryMeta,
  baseFilters: readonly FilterEntry[] = NO_BASE_FILTERS
) {
  const { setFilters, setSearch, setPresets, setQuickFilters } = queryEndpoint;

  useEffect(() => {
    setFilters([...baseFilters, ...smartFilter.filters]);
    setSearch(smartFilter.search ?? '');
  }, [baseFilters, smartFilter.filters, smartFilter.search, setFilters, setSearch]);

  useEffect(() => {
    if (!meta.data) return;
    for (const group of meta.data.presetFilterGroups) {
      const names = smartFilter.presets[group.name] ?? [];
      setPresets(group.name, names);
    }
  }, [smartFilter.presets, setPresets, meta.data]);

  useEffect(() => {
    setQuickFilters(smartFilter.quickFilters);
  }, [smartFilter.quickFilters, setQuickFilters]);

  const handlePresetToggle = useCallback(
    (group: string, names: readonly string[]) => {
      const first = names[0];
      if (!first) {
        for (const token of smartFilter.tokens) {
          if (token.type === 'preset' && token.group === group) {
            smartFilter.removeToken(token.id);
          }
        }
        return;
      }
      const preset = meta.data?.presetFilterGroups
        .find((g) => g.name === group)
        ?.presets.find((p) => p.name === first);
      if (preset) {
        smartFilter.addPresetToken(group, first, preset.label);
      }
    },
    [smartFilter, meta.data]
  );

  return { handlePresetToggle };
}
