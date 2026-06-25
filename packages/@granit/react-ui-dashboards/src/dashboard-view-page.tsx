import { RenderedDashboard, useDashboardDetail } from '@granit/react-dashboards';
import { useTranslation } from '@granit/react-localization';
import { Button, Spinner } from '@granit/react-ui';
import { EmptyState } from '@granit/react-ui-kit';
import { ArrowLeft, LayoutDashboard, Pencil } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

import { StatusBadge } from './components/dashboard-status-badge';

/**
 * Read-mode page for a single persisted dashboard. The list page
 * ({@link DashboardListPage}) links here to *visualize* a dashboard, while
 * `/dashboards/manage/:id/edit` ({@link DashboardEditPage}) opens the composer.
 *
 * - **Load** — `useDashboardDetail(id)` supplies the chrome (name, status,
 *   category) and the grid geometry (`layoutColumns` / `layoutRowHeight`).
 * - **Render** — `<RenderedDashboard>` issues the single
 *   `POST /dashboards/{id}/render` round-trip and dispatches each widget
 *   snapshot through the registries composed at the app root. Grid columns
 *   and row height are piped from the detail so the rendered layout matches
 *   the one persisted by the editor.
 */
export function DashboardViewPage() {
  const { id = '' } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const dashboardId = decodeURIComponent(id);
  const { data: detail, isLoading } = useDashboardDetail(dashboardId);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!detail) {
    return (
      <div data-slot="dashboard-view-page" className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/dashboards/manage')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('Common.Back', { defaultValue: 'Back' })}
        </Button>
        <EmptyState
          icon={LayoutDashboard}
          message={t('Dashboards.View.NotFound', { defaultValue: 'Dashboard not found.' })}
        />
      </div>
    );
  }

  return (
    <div
      data-slot="dashboard-view-page"
      data-dashboard-id={detail.id}
      data-dashboard-status={detail.status}
      className="space-y-4"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboards/manage')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('Common.Back', { defaultValue: 'Back' })}
          </Button>
          <div>
            <h2 className="text-2xl font-semibold text-foreground">{detail.name}</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              <StatusBadge status={detail.status} /> · {detail.category}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(`/dashboards/manage/${encodeURIComponent(dashboardId)}/edit`)}
        >
          <Pencil className="mr-2 h-4 w-4" />
          {t('Common.Edit', { defaultValue: 'Edit' })}
        </Button>
      </div>

      <RenderedDashboard
        dashboardId={dashboardId}
        columns={detail.layoutColumns}
        rowHeight={detail.layoutRowHeight}
      />
    </div>
  );
}
