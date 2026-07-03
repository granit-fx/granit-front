import { DASHBOARD_REFRESH_INTERVAL } from '@granit/dashboards';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { useDashboardContext } from './dashboard-context';
import { ChevronDownIcon, joinClasses, PILL_CLASS, RefreshIcon, SEGMENT_BUTTON_CLASS } from './pill-controls';

import type { DashboardRefreshInterval } from '@granit/dashboards';

interface RefreshOption {
  readonly value: DashboardRefreshInterval;
  readonly labelKey: string;
  readonly defaultLabel: string;
}

const R = DASHBOARD_REFRESH_INTERVAL;

/** Grafana-style refresh cadences, in display order. */
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

export interface DashboardRefreshToolbarProps {
  readonly className?: string;
  /**
   * Manual "refresh now" handler. Defaults to invalidating every active query
   * (Grafana re-runs all panel queries), which refetches the dashboard bundle,
   * KPI metrics and grids at once. Apps that want to scope the invalidation
   * pass their own.
   */
  readonly onRefresh?: () => void;
}

/**
 * Top-of-dashboard auto-refresh control (Grafana's refresh picker): a cadence
 * dropdown plus a manual "refresh now" button. Reads / writes the surrounding
 * {@link DashboardContextProvider}; the cadence propagates through context to
 * every data-bound widget via {@link useEffectiveRefreshInterval}.
 *
 * Renders nothing when the cadence is read-only (`context.setRefreshInterval`
 * absent — embedded / preview / printable dashboards), so apps mount it
 * unconditionally.
 */
export function DashboardRefreshToolbar({ className, onRefresh }: DashboardRefreshToolbarProps) {
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
      data-slot="dashboard-refresh-toolbar"
      role="toolbar"
      aria-label="Dashboard refresh"
      className={joinClasses(PILL_CLASS, className)}
    >
      {/* Manual "refresh now" + the cadence picker, one segmented pill matching
          the time-window toolbar. */}
      <button
        type="button"
        data-slot="dashboard-refresh-now"
        aria-label={t('Dashboard:Refresh.Now', { defaultValue: 'Refresh now' })}
        onClick={refreshNow}
        className={SEGMENT_BUTTON_CLASS}
      >
        <RefreshIcon />
        <span>{t('Dashboard:Refresh.Label', { defaultValue: 'Refresh' })}</span>
      </button>

      <div className="relative flex items-center border-l">
        <select
          data-slot="dashboard-refresh-select"
          aria-label={t('Dashboard:Refresh.Cadence', { defaultValue: 'Refresh cadence' })}
          value={String(refreshInterval)}
          onChange={(event) => {
            const option = OPTIONS.find((o) => String(o.value) === event.target.value);
            if (option) setRefreshInterval(option.value);
          }}
          className="h-full cursor-pointer appearance-none bg-transparent py-1.5 pl-3 pr-8 font-medium text-foreground focus:outline-none focus-visible:bg-accent"
        >
          {OPTIONS.map((option) => (
            <option key={String(option.value)} value={String(option.value)}>
              {t(option.labelKey, { defaultValue: option.defaultLabel })}
            </option>
          ))}
        </select>
        <ChevronDownIcon className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      </div>
    </div>
  );
}
