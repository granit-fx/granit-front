import { useTranslation } from '@granit/react-localization';

import type { DashboardVersionDrift } from '@granit/dashboards';

function pickDriftTone(drift: DashboardVersionDrift): string {
  if (drift === 'behind') return 'bg-warning-500/15 text-warning';
  if (drift === 'ahead') return 'bg-primary/10 text-primary';
  return 'bg-muted text-muted-foreground';
}

function pickDriftLabel(
  drift: DashboardVersionDrift,
  catalogVersion: string | null,
  t: ReturnType<typeof useTranslation>['t']
): string {
  if (drift === 'behind') {
    if (catalogVersion) {
      return t('Dashboards.List.Drift.BehindWithVersion', {
        version: catalogVersion,
        defaultValue: 'Out of date · v{{version}} available',
      });
    }
    return t('Dashboards.List.Drift.Behind', { defaultValue: 'Out of date' });
  }
  if (drift === 'ahead') {
    if (catalogVersion) {
      return t('Dashboards.List.Drift.AheadWithVersion', {
        version: catalogVersion,
        defaultValue: 'Ahead of catalog · catalog v{{version}}',
      });
    }
    return t('Dashboards.List.Drift.Ahead', { defaultValue: 'Ahead of catalog' });
  }
  return t('Dashboards.List.Drift.Unknown', { defaultValue: 'Source unknown' });
}

interface DriftBadgeProps {
  readonly drift: DashboardVersionDrift;
  readonly catalogVersion: string | null;
}

export function DriftBadge({ drift, catalogVersion }: DriftBadgeProps) {
  const { t } = useTranslation();
  // Aligned + ad-hoc are the happy paths — no badge keeps the row
  // visually quiet for the common case. Ahead / unknown surface for
  // visibility but don't read as actionable.
  if (drift === 'aligned' || drift === 'ad-hoc') return null;
  const tone = pickDriftTone(drift);
  const label = pickDriftLabel(drift, catalogVersion, t);
  return (
    <span
      data-slot="dashboard-drift-badge"
      data-drift={drift}
      className={`inline-block rounded-sm px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${tone}`}
    >
      {label}
    </span>
  );
}
