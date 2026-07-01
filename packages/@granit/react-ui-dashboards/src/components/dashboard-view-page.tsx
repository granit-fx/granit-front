import { RenderedDashboard, useDashboardDetail } from '@granit/react-dashboards';
import { useTranslation } from '@granit/react-localization';
import { Button, Spinner } from '@granit/react-ui';
import { EmptyState } from '@granit/react-ui-kit';
import { ArrowLeft, LayoutDashboard, Pencil } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { DashboardComposer } from './dashboard-composer';
import { StatusBadge } from './dashboard-status-badge';

/**
 * Single-dashboard page with an **inline edit toggle** (Grafana/luzmo style).
 *
 * - **Read mode** — `useDashboardDetail(id)` supplies the chrome (name, status,
 *   category) and grid geometry; `<RenderedDashboard>` issues the single
 *   `POST /dashboards/{id}/render` round-trip. The "Edit" button flips to edit
 *   mode in place — no navigation.
 * - **Edit mode** — mounts the shared {@link DashboardComposer} (free
 *   drag/resize, hover toolbar, Save/Discard). Exiting drops straight back to
 *   read mode on the same page; the post-save cache invalidation refreshes the
 *   rendered view automatically.
 *
 * The standalone `/dashboards/manage/:id/edit` route ({@link DashboardEditPage})
 * mounts the same composer for deep links / bookmarks.
 */
export function DashboardViewPage() {
  const { id = '' } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);

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

  if (editing) {
    return (
      <div data-slot="dashboard-view-page" data-mode="edit" data-dashboard-id={detail.id}>
        <DashboardComposer
          dashboardId={dashboardId}
          onExit={() => setEditing(false)}
          exitLabel={t('Dashboards.View.BackToView', { defaultValue: 'Back to view' })}
        />
      </div>
    );
  }

  return (
    <div
      data-slot="dashboard-view-page"
      data-mode="view"
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
          data-slot="dashboard-view-edit-toggle"
          variant="outline"
          size="sm"
          onClick={() => setEditing(true)}
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
