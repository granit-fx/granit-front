import type { DashboardStatus } from '@granit/dashboards';

function pickStatusBadgeTone(status: DashboardStatus): string {
  if (status === 'Published') return 'bg-success-500/15 text-success';
  if (status === 'Draft') return 'bg-warning-500/15 text-warning';
  return 'bg-muted text-muted-foreground';
}

export function StatusBadge({ status }: { readonly status: DashboardStatus }) {
  const tone = pickStatusBadgeTone(status);
  return (
    <span
      data-slot="dashboard-status-badge"
      className={`inline-block rounded-sm px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${tone}`}
    >
      {status}
    </span>
  );
}
