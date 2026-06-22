import type { DashboardStatus } from '@granit/dashboards';

function pickStatusBadgeTone(status: DashboardStatus): string {
  if (status === 'Published') return 'bg-success-500/15 text-success-600 dark:text-success-500';
  if (status === 'Draft') return 'bg-warning-500/15 text-warning-600 dark:text-warning-500';
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
