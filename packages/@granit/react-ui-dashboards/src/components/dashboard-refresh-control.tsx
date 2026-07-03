import { DASHBOARD_REFRESH_INTERVAL } from '@granit/dashboards';
import { useDashboardContext } from '@granit/react-dashboards';
import { useTranslation } from '@granit/react-localization';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@granit/react-ui';
import { cn } from '@granit/utils';
import { useQueryClient } from '@tanstack/react-query';
import { RefreshCw } from 'lucide-react';

import type { DashboardRefreshInterval } from '@granit/dashboards';

const R = DASHBOARD_REFRESH_INTERVAL;

interface RefreshOption {
  readonly value: DashboardRefreshInterval;
  readonly labelKey: string;
  readonly defaultLabel: string;
}

const OPTIONS: readonly RefreshOption[] = [
  { value: R.Off, labelKey: 'Dashboard:Refresh.Off', defaultLabel: 'Off' },
  { value: R.Auto, labelKey: 'Dashboard:Refresh.Auto', defaultLabel: 'Auto' },
  { value: R.Sec5, labelKey: 'Dashboard:Refresh.Sec5', defaultLabel: '5s' },
  { value: R.Sec10, labelKey: 'Dashboard:Refresh.Sec10', defaultLabel: '10s' },
  { value: R.Sec30, labelKey: 'Dashboard:Refresh.Sec30', defaultLabel: '30s' },
  { value: R.Min1, labelKey: 'Dashboard:Refresh.Min1', defaultLabel: '1m' },
  { value: R.Min5, labelKey: 'Dashboard:Refresh.Min5', defaultLabel: '5m' },
  { value: R.Min15, labelKey: 'Dashboard:Refresh.Min15', defaultLabel: '15m' },
  { value: R.Min30, labelKey: 'Dashboard:Refresh.Min30', defaultLabel: '30m' },
  { value: R.Hour1, labelKey: 'Dashboard:Refresh.Hour1', defaultLabel: '1h' },
  { value: R.Hour2, labelKey: 'Dashboard:Refresh.Hour2', defaultLabel: '2h' },
  { value: R.Day1, labelKey: 'Dashboard:Refresh.Day1', defaultLabel: '1d' },
];

const PILL =
  'inline-flex h-9 items-stretch overflow-hidden rounded-md border bg-background text-sm shadow-sm';
const SEG =
  'flex items-center gap-1.5 px-2.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:bg-accent';

export interface DashboardRefreshControlProps {
  readonly className?: string;
  /** Manual "refresh now" handler. Defaults to invalidating every active query. */
  readonly onRefresh?: () => void;
}

/**
 * UI-tier Grafana-style refresh control: a "↻ Refresh" segment + a styled Radix
 * {@link Select} cadence menu, one segmented pill matching
 * {@link DashboardTimeRangeControl}. Reads / writes the surrounding
 * {@link DashboardContextProvider}. Renders nothing when the cadence is
 * read-only (`setRefreshInterval` absent).
 */
export function DashboardRefreshControl({ className, onRefresh }: DashboardRefreshControlProps) {
  const { t } = useTranslation();
  const ctx = useDashboardContext();
  const queryClient = useQueryClient();

  const refreshNow =
    onRefresh ??
    (() => {
      void queryClient.invalidateQueries();
    });

  if (!ctx?.setRefreshInterval) return null;

  const { refreshInterval = 'auto', setRefreshInterval } = ctx;

  return (
    <div
      data-slot="dashboard-refresh-control"
      role="toolbar"
      aria-label="Dashboard refresh"
      className={cn(PILL, className)}
    >
      <button type="button" data-slot="refresh-now" onClick={refreshNow} className={SEG}>
        <RefreshCw className="h-4 w-4" aria-hidden />
        <span>{t('Dashboard:Refresh.Label', { defaultValue: 'Refresh' })}</span>
      </button>

      <Select
        value={String(refreshInterval)}
        onValueChange={(next) => {
          const option = OPTIONS.find((o) => String(o.value) === next);
          if (option) setRefreshInterval(option.value);
        }}
      >
        <SelectTrigger
          data-slot="refresh-cadence"
          aria-label={t('Dashboard:Refresh.Cadence', { defaultValue: 'Refresh cadence' })}
          className="h-full min-w-[4.5rem] rounded-none border-0 border-l bg-transparent font-medium text-foreground shadow-none focus-visible:ring-0"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="scrollbar-overlay">
          {OPTIONS.map((option) => (
            <SelectItem key={String(option.value)} value={String(option.value)}>
              {t(option.labelKey, { defaultValue: option.defaultLabel })}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
