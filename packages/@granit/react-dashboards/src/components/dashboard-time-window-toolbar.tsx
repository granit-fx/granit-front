import { DASHBOARD_TIME_WINDOW } from '@granit/dashboards';
import { useTranslation } from 'react-i18next';

import { useDashboardContext } from './dashboard-context';

import type { DashboardTimeWindow } from '@granit/dashboards';

/**
 * Preset windows the selector offers, in display order. Each carries the token
 * that identifies it in {@link DashboardTimeWindow.period} plus a localization
 * key (with an English fallback, mirroring {@link DashboardFilterToolbar} — the
 * package ships no locale files, host translations override via the key).
 */
interface TimeWindowPreset {
  readonly token: string;
  readonly window: DashboardTimeWindow;
  readonly labelKey: string;
  readonly defaultLabel: string;
}

const PRESETS: readonly TimeWindowPreset[] = [
  {
    token: 'last_24h',
    window: DASHBOARD_TIME_WINDOW.Last24Hours,
    labelKey: 'Dashboard:TimeWindow.Last24Hours',
    defaultLabel: 'Last 24 hours',
  },
  {
    token: 'last_7d',
    window: DASHBOARD_TIME_WINDOW.Last7Days,
    labelKey: 'Dashboard:TimeWindow.Last7Days',
    defaultLabel: 'Last 7 days',
  },
  {
    token: 'last_30d',
    window: DASHBOARD_TIME_WINDOW.Last30Days,
    labelKey: 'Dashboard:TimeWindow.Last30Days',
    defaultLabel: 'Last 30 days',
  },
  {
    token: 'mtd',
    window: DASHBOARD_TIME_WINDOW.Mtd,
    labelKey: 'Dashboard:TimeWindow.Mtd',
    defaultLabel: 'Month to date',
  },
  {
    token: 'ytd',
    window: DASHBOARD_TIME_WINDOW.Ytd,
    labelKey: 'Dashboard:TimeWindow.Ytd',
    defaultLabel: 'Year to date',
  },
  {
    token: 'last_5m',
    window: DASHBOARD_TIME_WINDOW.RealtimeLast5Minutes,
    labelKey: 'Dashboard:TimeWindow.RealtimeLast5Minutes',
    defaultLabel: 'Realtime (last 5 min)',
  },
];

export interface DashboardTimeWindowToolbarProps {
  readonly className?: string;
}

/**
 * Top-of-dashboard control selecting the active {@link DashboardTimeWindow}.
 * Reads / writes the surrounding {@link DashboardContextProvider}: the chosen
 * window propagates through context to every data-bound widget via
 * {@link useEffectiveTimeWindow}, so a KPI / chart tile re-fetches without any
 * prop drilling.
 *
 * Renders nothing when the dashboard declares no time window
 * (`context.timeWindow` absent) or when the window is read-only
 * (`context.setTimeWindow` absent — embedded / preview / printable
 * dashboards), so apps can mount it unconditionally.
 *
 * v1 offers the framework's {@link DASHBOARD_TIME_WINDOW} presets. A window
 * carrying an absolute range or a token outside the preset set stays selected
 * as a disabled "Custom range" entry; a richer picker (absolute ranges, custom
 * comparison) is a follow-up an app composes on the same context.
 */
export function DashboardTimeWindowToolbar({ className }: DashboardTimeWindowToolbarProps) {
  const { t } = useTranslation();
  const ctx = useDashboardContext();

  if (!ctx?.timeWindow || !ctx.setTimeWindow) return null;

  const { timeWindow, setTimeWindow } = ctx;
  const currentToken = 'token' in timeWindow.period ? timeWindow.period.token : '';
  const matched = PRESETS.some((preset) => preset.token === currentToken);

  return (
    <div
      data-slot="dashboard-time-window-toolbar"
      role="toolbar"
      aria-label="Dashboard time window"
      className={joinClasses('flex items-end gap-3', className)}
    >
      <label className="flex flex-col gap-1 text-xs">
        <span data-slot="dashboard-time-window-label" className="text-muted-foreground">
          {t('Dashboard:TimeWindow.Label', { defaultValue: 'Period' })}
        </span>
        <select
          data-slot="dashboard-time-window-select"
          value={matched ? currentToken : ''}
          onChange={(event) => {
            const preset = PRESETS.find((p) => p.token === event.target.value);
            // Spread over the current window so an app-set `compareTo` /
            // `aggregation` survives a period change; the preset owns `period`
            // and `kind` (History vs Realtime).
            if (preset) setTimeWindow({ ...timeWindow, ...preset.window });
          }}
          className="rounded-md border bg-background px-2.5 py-1.5 text-sm"
        >
          {!matched && (
            <option value="" disabled>
              {t('Dashboard:TimeWindow.Custom', { defaultValue: 'Custom range' })}
            </option>
          )}
          {PRESETS.map((preset) => (
            <option key={preset.token} value={preset.token}>
              {t(preset.labelKey, { defaultValue: preset.defaultLabel })}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

function joinClasses(...parts: ReadonlyArray<string | undefined>): string {
  return parts.filter(Boolean).join(' ');
}
