import { useNavigate, useParams } from 'react-router-dom';

import { DashboardComposer } from './components/dashboard-composer';

/**
 * Standalone per-dashboard composer route (`/dashboards/manage/:id/edit`). Thin
 * wrapper around the shared {@link DashboardComposer} — the same surface the
 * {@link DashboardViewPage} mounts inline behind its edit toggle. Here "exit"
 * routes back to the dashboard list.
 */
export function DashboardEditPage() {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dashboardId = decodeURIComponent(id);

  return (
    <DashboardComposer
      dashboardId={dashboardId}
      rootSlot="dashboard-edit-page"
      onExit={() => navigate('/dashboards/manage')}
    />
  );
}

// Re-exported for tests + downstream tooling.
export type { DashboardDetailResponse } from '@granit/dashboards';
