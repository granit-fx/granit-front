import { useTranslation } from 'react-i18next';

import { useDashboardContext } from './dashboard-context.js';
import { useDashboardView } from './dashboard-view-context.js';

import type { DashboardView } from '@granit/dashboards';

/**
 * Tabs-style view switcher. Renders one button per
 * {@link DashboardView}, highlights the active one, and switches the
 * dashboard's view via either:
 *
 * - the controlled `currentView` + `onChange` props (typical when the
 *   parent owns the view state — URL binding, breadcrumb sync), OR
 * - the surrounding {@link DashboardViewProvider} when the props are
 *   omitted (works inside `<Dashboard>` automatically).
 *
 * Labels resolve through `useTranslation()` against
 * `view.displayNameLocalizationKey ?? Dashboard:{name}.View.{viewName}`
 * — the convention the backend ships when the field is null. When no
 * translation is found, the view's `name` is used verbatim.
 *
 * Renders nothing for single-view dashboards (`views` empty / null).
 */
export interface DashboardViewSwitcherProps {
  readonly views: readonly DashboardView[] | null | undefined;
  /**
   * Controlled active view name. When omitted, the switcher reads the
   * view from the surrounding {@link DashboardViewProvider}.
   */
  readonly currentView?: string | null;
  /**
   * Notification when a tab is clicked. When omitted, the switcher
   * dispatches via the surrounding {@link DashboardViewProvider}.
   */
  readonly onChange?: (name: string) => void;
  readonly className?: string;
}

export function DashboardViewSwitcher({
  views,
  currentView,
  onChange,
  className,
}: DashboardViewSwitcherProps) {
  const { t } = useTranslation();
  const dashboardCtx = useDashboardContext();
  const viewCtx = useDashboardView();

  const activeView = currentView === undefined ? (viewCtx?.currentView ?? null) : currentView;
  const setView = onChange ?? viewCtx?.setCurrentView;

  if (!views || views.length === 0 || !setView) return null;

  return (
    <div
      data-slot="dashboard-view-switcher"
      role="tablist"
      aria-label="Dashboard views"
      className={joinClasses(
        'inline-flex items-center gap-1 rounded-md border bg-card p-1',
        className
      )}
    >
      {views.map((view) => {
        const isActive = view.name === activeView;
        const labelKey =
          view.displayNameLocalizationKey ??
          (dashboardCtx
            ? `Dashboard:${dashboardCtx.dashboardName}.View.${view.name}`
            : `Dashboard:View.${view.name}`);
        const label = t(labelKey, { defaultValue: view.name });
        return (
          <button
            key={view.name}
            type="button"
            role="tab"
            data-slot="dashboard-view-switcher-tab"
            data-view-name={view.name}
            data-active={isActive || undefined}
            aria-selected={isActive}
            onClick={() => setView(view.name)}
            className={joinClasses(
              'rounded-sm px-2.5 py-1 text-sm transition-colors',
              isActive
                ? 'bg-foreground text-background'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

function joinClasses(...parts: ReadonlyArray<string | undefined>): string {
  return parts.filter(Boolean).join(' ');
}
