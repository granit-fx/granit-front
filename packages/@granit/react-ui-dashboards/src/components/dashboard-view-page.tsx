import {
  DASHBOARD_TIME_WINDOW,
  resolveTimeWindowToRenderRequest,
  toRefetchInterval,
} from '@granit/dashboards';
import {
  DashboardContextProvider,
  RenderedDashboard,
  useDashboardDetail,
  useDashboardRefreshIntervalState,
  useDashboardTimeWindowState,
} from '@granit/react-dashboards';
import { useFirstDayOfWeek, useTimezone, useTranslation } from '@granit/react-localization';
import { Button, Spinner } from '@granit/react-ui';
import { EmptyState } from '@granit/react-ui-kit';
import { ArrowLeft, LayoutDashboard, Pencil } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { DashboardComposer } from './dashboard-composer';
import { DashboardRefreshControl } from './dashboard-refresh-control';
import { StatusBadge } from './dashboard-status-badge';
import { DashboardTimeRangeControl } from './dashboard-time-range-control';

import type { DashboardDetailResponse } from '@granit/dashboards';

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

  // Content is mounted only once `detail` has loaded, so its time-window /
  // refresh state can seed from the dashboard's persisted default on first
  // render (a `useState` initialiser cannot pick it up during the loading pass).
  return (
    <DashboardViewContent
      detail={detail}
      dashboardId={dashboardId}
      onEdit={() => setEditing(true)}
    />
  );
}

interface DashboardViewContentProps {
  readonly detail: DashboardDetailResponse;
  readonly dashboardId: string;
  readonly onEdit: () => void;
}

function DashboardViewContent({ detail, dashboardId, onEdit }: DashboardViewContentProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Active render window. Seeded from the dashboard's persisted default,
  // falling back to Last 30 days. A token window is sent to the server as
  // `{ periodToken }` alone — the bundle endpoint resolves it authoritatively
  // (timezone- / first-day-aware), so changing the window re-fetches the bundle.
  const [timeWindow, setTimeWindow] = useDashboardTimeWindowState(
    detail.defaultTimeWindow ?? DASHBOARD_TIME_WINDOW.Last30Days
  );
  const renderRequest = useMemo(
    () => (timeWindow ? resolveTimeWindowToRenderRequest(timeWindow) : undefined),
    [timeWindow]
  );
  // The shift / zoom controls resolve token windows to absolute bounds on the
  // client, so they need the same first day of week / timezone the backend
  // `Granit.Timing` resolver uses. The app feeds the
  // `Granit.Timing.PreferredFirstDayOfWeek` / `Granit.Timing.PreferredTimezone`
  // settings into the providers these hooks read.
  const weekStartsOn = useFirstDayOfWeek();
  const timeZone = useTimezone();

  // Auto-refresh cadence, bridged to the bundle query's refetch interval.
  const [refreshInterval, setRefreshInterval] = useDashboardRefreshIntervalState('auto');
  const renderOptions = useMemo(
    () => ({ refetchInterval: toRefetchInterval(refreshInterval ?? 'auto') }),
    [refreshInterval]
  );

  return (
    <DashboardContextProvider
      value={{
        dashboardName: detail.name,
        timeWindow,
        setTimeWindow,
        refreshInterval,
        setRefreshInterval,
        weekStartsOn,
        timeZone,
      }}
    >
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
          <div className="flex items-end gap-3">
            <DashboardTimeRangeControl />
            <DashboardRefreshControl />
            <Button
              data-slot="dashboard-view-edit-toggle"
              variant="outline"
              size="sm"
              onClick={onEdit}
            >
              <Pencil className="mr-2 h-4 w-4" />
              {t('Common.Edit', { defaultValue: 'Edit' })}
            </Button>
          </div>
        </div>

        <RenderedDashboard
          dashboardId={dashboardId}
          request={renderRequest}
          options={renderOptions}
          columns={detail.layoutColumns}
          rowHeight={detail.layoutRowHeight}
        />
      </div>
    </DashboardContextProvider>
  );
}
