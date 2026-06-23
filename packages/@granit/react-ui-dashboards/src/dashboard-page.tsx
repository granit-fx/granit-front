import { Dashboard, DashboardViewSwitcher, RenderedDashboard } from '@granit/react-dashboards';
import { useTranslation } from '@granit/react-localization';
import { Button } from '@granit/react-ui';
import { Pencil } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import { sampleFinanceDashboard } from './sample-finance-dashboard';

import type { DashboardView } from '@granit/dashboards';

/**
 * Showcase demo page rendering the {@link sampleFinanceDashboard} fixture
 * three ways for direct comparison:
 *
 * 1. **Definition path** — `<Dashboard definition={...}>`. Each widget
 *    fetches its own data (e.g. `KpiTile` calls `useMetric` independently).
 *    Useful for catalog previews and standalone tiles where bundling round-
 *    trips is wasteful.
 *
 * 2. **Bundle path** — `<RenderedDashboard dashboardId={...}>`. Single
 *    `POST /dashboards/{id}/render` round-trip; the snapshot registries
 *    composed at the app root (definition Markdown / Text / Image plus
 *    Kpi / Chart / Table / Pivot / Map renderers) dispatch each kind via
 *    `widgetType`. Layout reconstructs from the per-widget structural
 *    metadata (P1 envelope extension).
 *
 * 3. **Multi-view bundle path** — `<RenderedDashboard currentView=...>`
 *    paired with `<DashboardViewSwitcher>`. The MSW handler honors
 *    `request.viewName` (P2 backend) and returns view-specific subsets.
 *    Two views shipped: `'overview'` (banner + 2 KPIs + chart) and
 *    `'details'` (banner + table + pivot + map).
 *
 * Production-mode dashboards will keep only path 2 — the registries +
 * `MapTileProviderProvider` are wired once in `App.tsx` and apps just drop
 * `<RenderedDashboard>` wherever a dashboard needs to render.
 */

// Surfaced to the view switcher. Only `name` + `displayNameLocalizationKey`
// are read by the switcher; the per-view widget pool is server-side
// (the MSW handler synthesizes view-specific bundles).
const DEMO_VIEWS: readonly DashboardView[] = [
  { name: 'overview', widgets: [], displayNameLocalizationKey: 'Dashboards.Demo.Views.Overview' },
  { name: 'details', widgets: [], displayNameLocalizationKey: 'Dashboards.Demo.Views.Details' },
];

// Mirrors the MSW seed `SAMPLE_FINANCE_DASHBOARD_ID` in
// `@granit/react-dashboards/testing`. Inlined here so this shipped demo page
// does not import the test-only `/testing` barrel into the bundle.
const SAMPLE_FINANCE_DASHBOARD_ID = '8c6b1e10-0000-4000-8000-000000000001';

export function DashboardPage() {
  const { t } = useTranslation();
  const dashboardName = sampleFinanceDashboard.name;
  const title = t(`Dashboard:${dashboardName}`, { defaultValue: dashboardName });
  const description = t(`Dashboard:${dashboardName}.Description`, { defaultValue: '' });
  const [currentView, setCurrentView] = useState<string>('overview');

  return (
    <div data-slot="dashboard-page" className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">{title}</h2>
          {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
        </div>
        <Button asChild variant="outline" size="sm">
          <Link to="/dashboards/manage">
            <Pencil className="mr-2 h-4 w-4" />
            {t('Dashboards.Demo.ManageDashboards', { defaultValue: 'Manage dashboards' })}
          </Link>
        </Button>
      </div>

      <section data-slot="dashboard-definition-section" className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Definition path · per-widget data fetch
        </h3>
        <Dashboard definition={sampleFinanceDashboard} />
      </section>

      <section data-slot="dashboard-bundle-section" className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Bundle path · POST /dashboards/{'{id}'}/render
        </h3>
        <RenderedDashboard dashboardId={SAMPLE_FINANCE_DASHBOARD_ID} />
      </section>

      <section data-slot="dashboard-multi-view-section" className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Multi-view bundle path · request.viewName
          </h3>
          <DashboardViewSwitcher
            views={DEMO_VIEWS}
            currentView={currentView}
            onChange={setCurrentView}
          />
        </div>
        <RenderedDashboard
          dashboardId={SAMPLE_FINANCE_DASHBOARD_ID}
          currentView={currentView}
          onViewChange={setCurrentView}
        />
      </section>
    </div>
  );
}
