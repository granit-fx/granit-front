import { createContext, useCallback, useContext, useMemo, useState } from 'react';

import type { DashboardFilter } from '@granit/dashboards';

/**
 * Live filter values keyed by `DashboardFilter.name`. Strings on the
 * wire — matches `DashboardRenderRequest.filters` shape (per ADR-039
 * §6.1, the QueryEngine accepts string-encoded values regardless of
 * the underlying clause type, with parsing on the server side).
 *
 * `null` removes the filter from the request — useful for
 * "all" / "any" semantics where the user explicitly clears a control.
 */
export type DashboardFilterValues = Readonly<Record<string, string | null>>;

/**
 * Filter context surfaced to consumers — toolbar inputs, action
 * handlers (future `WidgetActionKind.SetFilter`), and
 * `<RenderedDashboard>` so the bundle render request picks up live
 * values automatically.
 */
export interface DashboardFilterContextValue {
  /** Current values, keyed by filter name. */
  readonly values: DashboardFilterValues;
  /** Sets one filter's value (`null` clears it). */
  readonly setValue: (filterName: string, value: string | null) => void;
  /** Resets every editable filter to its initial value (typically empty). */
  readonly resetAll: () => void;
  /**
   * Filter declarations from the dashboard definition — exposed so
   * the toolbar / action handlers don't need to thread the definition
   * through their props.
   */
  readonly filters: readonly DashboardFilter[];
}

const DashboardFilterContext = createContext<DashboardFilterContextValue | null>(null);

export interface DashboardFilterProviderProps {
  readonly filters: readonly DashboardFilter[] | null | undefined;
  /**
   * Initial values seeded into the provider. Useful for URL-bound
   * filters (parent reads `?customer=42` from the location and feeds
   * it here). Falls back to an empty map when omitted — every editable
   * filter starts unset.
   */
  readonly initialValues?: DashboardFilterValues;
  /**
   * Notification fired on every value change. Apps wire this to URL
   * sync, persistence, or telemetry. Internal state still tracks the
   * value regardless — the provider is uncontrolled by default.
   */
  readonly onChange?: (values: DashboardFilterValues) => void;
  readonly children: React.ReactNode;
}

/**
 * Provider for live dashboard filter values. Pairs with
 * {@link useDashboardFilters} for read/write access and
 * {@link mergeFilterValuesIntoRequest} for plugging into the render
 * request.
 *
 * Renders a no-op provider for single-filter-less dashboards (filters
 * empty / null) so apps drop the provider unconditionally without
 * worrying about whether the dashboard ships filters.
 */
export function DashboardFilterProvider({
  filters,
  initialValues,
  onChange,
  children,
}: DashboardFilterProviderProps) {
  const declaredFilters = useMemo(() => filters ?? [], [filters]);
  const [values, setValuesState] = useState<DashboardFilterValues>(initialValues ?? {});

  const setValue = useCallback(
    (filterName: string, value: string | null) => {
      setValuesState((current) => {
        const next: Record<string, string | null> = { ...current, [filterName]: value };
        onChange?.(next);
        return next;
      });
    },
    [onChange]
  );

  const resetAll = useCallback(() => {
    setValuesState(() => {
      const cleared = initialValues ?? {};
      onChange?.(cleared);
      return cleared;
    });
  }, [initialValues, onChange]);

  const value = useMemo<DashboardFilterContextValue>(
    () => ({ values, setValue, resetAll, filters: declaredFilters }),
    [values, setValue, resetAll, declaredFilters]
  );

  return (
    <DashboardFilterContext.Provider value={value}>{children}</DashboardFilterContext.Provider>
  );
}

/**
 * Reads the current filter context. Returns `null` when called outside
 * a `<DashboardFilterProvider>` so consumers (toolbar, render request)
 * gracefully degrade without throwing.
 */
export function useDashboardFilters(): DashboardFilterContextValue | null {
  return useContext(DashboardFilterContext);
}
