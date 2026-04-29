import { useTranslation } from 'react-i18next';

import { useDashboardFilters } from './dashboard-filter-context.js';

import type { DashboardFilter } from '@granit/dashboards';

/**
 * Toolbar surfacing every **editable** dashboard filter as a text
 * input. Reads / writes the surrounding {@link DashboardFilterProvider}
 * — mount the provider at or above the toolbar's parent.
 *
 * v1 ships a single text-input per filter regardless of the clause
 * shape. Lookup-bound filters (entity pickers, date ranges, multi-
 * select) are deferred to follow-up components consumers compose on
 * top of the same provider — the framework's contract is "manage
 * values keyed by filter name", not "provide every input control".
 *
 * Non-editable filters (`editable: false` or missing) are silent —
 * the toolbar skips them. They still apply to the bundle render via
 * any pre-populated values the parent feeds into
 * {@link DashboardFilterProvider.initialValues}.
 *
 * Renders nothing for filter-less dashboards, so apps drop the
 * toolbar unconditionally without checking for `filters?.length`.
 */
export interface DashboardFilterToolbarProps {
  readonly className?: string;
}

export function DashboardFilterToolbar({ className }: DashboardFilterToolbarProps) {
  const { t } = useTranslation();
  const ctx = useDashboardFilters();

  if (!ctx) return null;

  const editable = ctx.filters.filter((f) => f.editable === true);
  if (editable.length === 0) return null;

  return (
    <div
      data-slot="dashboard-filter-toolbar"
      role="toolbar"
      aria-label="Dashboard filters"
      className={joinClasses('flex flex-wrap items-end gap-3', className)}
    >
      {editable.map((filter) => (
        <FilterControl key={filter.name} filter={filter} />
      ))}
      <button
        type="button"
        data-slot="dashboard-filter-toolbar-reset"
        onClick={() => ctx.resetAll()}
        className="rounded-md border bg-background px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
      >
        {t('Dashboard:Filter.Reset', { defaultValue: 'Reset' })}
      </button>
    </div>
  );
}

function FilterControl({ filter }: { readonly filter: DashboardFilter }) {
  const { t } = useTranslation();
  const ctx = useDashboardFilters();
  if (!ctx) return null;

  const rawValue = ctx.values[filter.name];
  const inputValue = rawValue ?? '';
  const label = t(filter.labelLocalizationKey, { defaultValue: filter.name });

  return (
    <label className="flex flex-col gap-1 text-xs">
      <span data-slot="dashboard-filter-label" className="text-muted-foreground">
        {label}
      </span>
      <input
        type="text"
        data-slot="dashboard-filter-input"
        data-filter-name={filter.name}
        value={inputValue}
        onChange={(event) => {
          const next = event.target.value;
          ctx.setValue(filter.name, next === '' ? null : next);
        }}
        className="rounded-md border bg-background px-2.5 py-1.5 text-sm"
      />
    </label>
  );
}

function joinClasses(...parts: ReadonlyArray<string | undefined>): string {
  return parts.filter(Boolean).join(' ');
}
