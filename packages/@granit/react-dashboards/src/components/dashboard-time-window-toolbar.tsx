import { DASHBOARD_TIME_WINDOW, shiftTimeWindow, zoomOutTimeWindow } from '@granit/dashboards';
import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { useDashboardContext } from './dashboard-context';

import type { DashboardTimeWindow } from '@granit/dashboards';

/** Sentinel `<select>` value that reveals the absolute-range inputs. */
const CUSTOM_VALUE = '__custom__';

/**
 * One quick-range option. Carries the token that identifies it in
 * {@link DashboardTimeWindow.period} plus a localization key (with an English
 * fallback, mirroring {@link DashboardFilterToolbar} — the package ships no
 * locale files, host translations override via the key).
 */
interface TimeWindowPreset {
  readonly token: string;
  readonly window: DashboardTimeWindow;
  readonly labelKey: string;
  readonly defaultLabel: string;
}

interface TimeWindowGroup {
  readonly labelKey: string;
  readonly defaultLabel: string;
  readonly presets: readonly TimeWindowPreset[];
}

const W = DASHBOARD_TIME_WINDOW;

function preset(
  window: DashboardTimeWindow,
  labelKey: string,
  defaultLabel: string
): TimeWindowPreset {
  const token = 'token' in window.period ? window.period.token : '';
  return { token, window, labelKey, defaultLabel };
}

/** Grafana-style quick ranges, grouped for a scannable dropdown. */
const GROUPS: readonly TimeWindowGroup[] = [
  {
    labelKey: 'Dashboard:TimeWindow.Group.MinutesHours',
    defaultLabel: 'Minutes & hours',
    presets: [
      preset(W.Last5Minutes, 'Dashboard:TimeWindow.Last5Minutes', 'Last 5 minutes'),
      preset(W.Last15Minutes, 'Dashboard:TimeWindow.Last15Minutes', 'Last 15 minutes'),
      preset(W.Last30Minutes, 'Dashboard:TimeWindow.Last30Minutes', 'Last 30 minutes'),
      preset(W.Last1Hour, 'Dashboard:TimeWindow.Last1Hour', 'Last 1 hour'),
      preset(W.Last3Hours, 'Dashboard:TimeWindow.Last3Hours', 'Last 3 hours'),
      preset(W.Last6Hours, 'Dashboard:TimeWindow.Last6Hours', 'Last 6 hours'),
      preset(W.Last12Hours, 'Dashboard:TimeWindow.Last12Hours', 'Last 12 hours'),
      preset(W.Last24Hours, 'Dashboard:TimeWindow.Last24Hours', 'Last 24 hours'),
    ],
  },
  {
    labelKey: 'Dashboard:TimeWindow.Group.Days',
    defaultLabel: 'Days',
    presets: [
      preset(W.Last2Days, 'Dashboard:TimeWindow.Last2Days', 'Last 2 days'),
      preset(W.Last7Days, 'Dashboard:TimeWindow.Last7Days', 'Last 7 days'),
      preset(W.Last30Days, 'Dashboard:TimeWindow.Last30Days', 'Last 30 days'),
    ],
  },
  {
    labelKey: 'Dashboard:TimeWindow.Group.MonthsYears',
    defaultLabel: 'Months & years',
    presets: [
      preset(W.Last3Months, 'Dashboard:TimeWindow.Last3Months', 'Last 3 months'),
      preset(W.Last6Months, 'Dashboard:TimeWindow.Last6Months', 'Last 6 months'),
      preset(W.Last1Year, 'Dashboard:TimeWindow.Last1Year', 'Last 1 year'),
      preset(W.Last2Years, 'Dashboard:TimeWindow.Last2Years', 'Last 2 years'),
      preset(W.Last5Years, 'Dashboard:TimeWindow.Last5Years', 'Last 5 years'),
    ],
  },
  {
    labelKey: 'Dashboard:TimeWindow.Group.RelativeDays',
    defaultLabel: 'Relative days',
    presets: [
      preset(W.Today, 'Dashboard:TimeWindow.Today', 'Today'),
      preset(W.Yesterday, 'Dashboard:TimeWindow.Yesterday', 'Yesterday'),
      preset(
        W.DayBeforeYesterday,
        'Dashboard:TimeWindow.DayBeforeYesterday',
        'Day before yesterday'
      ),
      preset(W.ThisDayLastWeek, 'Dashboard:TimeWindow.ThisDayLastWeek', 'This day last week'),
    ],
  },
  {
    labelKey: 'Dashboard:TimeWindow.Group.ToDate',
    defaultLabel: 'To date',
    presets: [
      preset(W.Wtd, 'Dashboard:TimeWindow.Wtd', 'This week (WTD)'),
      preset(W.Mtd, 'Dashboard:TimeWindow.Mtd', 'This month (MTD)'),
      preset(W.Qtd, 'Dashboard:TimeWindow.Qtd', 'This quarter (QTD)'),
      preset(W.Ytd, 'Dashboard:TimeWindow.Ytd', 'This year (YTD)'),
    ],
  },
  {
    labelKey: 'Dashboard:TimeWindow.Group.Previous',
    defaultLabel: 'Previous',
    presets: [
      preset(W.Pw, 'Dashboard:TimeWindow.Pw', 'Previous week (PW)'),
      preset(W.Pm, 'Dashboard:TimeWindow.Pm', 'Previous month (PM)'),
      preset(W.Pq, 'Dashboard:TimeWindow.Pq', 'Previous quarter (PQ)'),
      preset(W.Py, 'Dashboard:TimeWindow.Py', 'Previous year (PY)'),
    ],
  },
];

const ALL_PRESETS: readonly TimeWindowPreset[] = GROUPS.flatMap((group) => group.presets);

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
 * Offers the framework's {@link DASHBOARD_TIME_WINDOW} quick ranges, grouped
 * (minutes/hours, days, months/years, relative days, to-date, previous). A
 * window carrying an absolute range or a token outside the preset set stays
 * selected as a disabled "Custom range" entry; a richer picker (absolute
 * ranges) is a follow-up an app composes on the same context.
 */
export function DashboardTimeWindowToolbar({ className }: DashboardTimeWindowToolbarProps) {
  const { t } = useTranslation();
  const ctx = useDashboardContext();

  // Hooks run before the early return (rules of hooks). Seed the custom-range
  // drafts from the active window when it is already an absolute range.
  const period = ctx?.timeWindow?.period;
  const initialAbsolute = period !== undefined && 'from' in period;
  const [customOpen, setCustomOpen] = useState(initialAbsolute);
  const [draftFrom, setDraftFrom] = useState(() =>
    initialAbsolute ? toLocalInput(period.from) : ''
  );
  const [draftTo, setDraftTo] = useState(() => (initialAbsolute ? toLocalInput(period.to) : ''));

  if (!ctx?.timeWindow || !ctx.setTimeWindow) return null;

  const { timeWindow, setTimeWindow } = ctx;
  // Shift / zoom resolve token windows to absolute bounds client-side, so they
  // need the same timezone / first-day the backend resolver uses to stay aligned.
  const shiftOptions = { weekStartsOn: ctx.weekStartsOn, timeZone: ctx.timeZone };
  const currentToken = 'token' in timeWindow.period ? timeWindow.period.token : '';
  const matched = ALL_PRESETS.some((p) => p.token === currentToken);
  const selectValue = customOpen ? CUSTOM_VALUE : matched ? currentToken : '';

  const applyCustom = () => {
    const from = new Date(draftFrom);
    const to = new Date(draftTo);
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from >= to) return;
    setTimeWindow({ period: { from: from.toISOString(), to: to.toISOString() } });
  };

  const customValid = draftFrom !== '' && draftTo !== '' && new Date(draftFrom) < new Date(draftTo);

  return (
    <div
      data-slot="dashboard-time-window-toolbar"
      className={joinClasses('relative inline-block', className)}
    >
      {/* Grafana-style segmented pill: shift back « · clock + range picker ▾ ·
          shift forward » · zoom out ⊖. */}
      <div
        role="toolbar"
        aria-label="Dashboard time window"
        className="inline-flex h-9 items-stretch overflow-hidden rounded-md border bg-background text-sm shadow-sm"
      >
        <button
          type="button"
          data-slot="dashboard-time-window-back"
          aria-label={t('Dashboard:TimeWindow.ShiftBack', { defaultValue: 'Shift earlier' })}
          onClick={() => setTimeWindow(shiftTimeWindow(timeWindow, 'back', shiftOptions))}
          className={SEGMENT_BUTTON_CLASS}
        >
          <ChevronsLeftIcon />
        </button>

        <div className="relative flex items-center border-l">
          <ClockIcon className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <select
            data-slot="dashboard-time-window-select"
            aria-label={t('Dashboard:TimeWindow.Label', { defaultValue: 'Period' })}
            value={selectValue}
            onChange={(event) => {
              const value = event.target.value;
              if (value === CUSTOM_VALUE) {
                setCustomOpen(true);
                return;
              }
              const next = ALL_PRESETS.find((p) => p.token === value);
              // Spread over the current window so an app-set `compareTo` /
              // `aggregation` survives a period change; the preset owns `period`
              // and `kind`.
              if (next) {
                setCustomOpen(false);
                setTimeWindow({ ...timeWindow, ...next.window });
              }
            }}
            className="h-full cursor-pointer appearance-none bg-transparent py-1.5 pl-9 pr-8 font-medium text-foreground focus:outline-none focus-visible:bg-accent"
          >
            {!matched && !customOpen && (
              <option value="" disabled>
                {t('Dashboard:TimeWindow.Placeholder', { defaultValue: 'Select…' })}
              </option>
            )}
            <option value={CUSTOM_VALUE}>
              {t('Dashboard:TimeWindow.Custom', { defaultValue: 'Custom range' })}
            </option>
            {GROUPS.map((group) => (
              <optgroup
                key={group.labelKey}
                label={t(group.labelKey, { defaultValue: group.defaultLabel })}
              >
                {group.presets.map((p) => (
                  <option key={p.token} value={p.token}>
                    {t(p.labelKey, { defaultValue: p.defaultLabel })}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <ChevronDownIcon className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        </div>

        <button
          type="button"
          data-slot="dashboard-time-window-forward"
          aria-label={t('Dashboard:TimeWindow.ShiftForward', { defaultValue: 'Shift later' })}
          onClick={() => setTimeWindow(shiftTimeWindow(timeWindow, 'forward', shiftOptions))}
          className={joinClasses('border-l', SEGMENT_BUTTON_CLASS)}
        >
          <ChevronsRightIcon />
        </button>
        <button
          type="button"
          data-slot="dashboard-time-window-zoom-out"
          aria-label={t('Dashboard:TimeWindow.ZoomOut', { defaultValue: 'Zoom out' })}
          onClick={() => setTimeWindow(zoomOutTimeWindow(timeWindow, shiftOptions))}
          className={joinClasses('border-l', SEGMENT_BUTTON_CLASS)}
        >
          <ZoomOutIcon />
        </button>
      </div>

      {customOpen && (
        <div
          data-slot="dashboard-time-window-custom"
          className="absolute left-0 top-full z-10 mt-1 flex items-end gap-2 rounded-md border bg-background p-3 shadow-md"
        >
          <label className="flex flex-col gap-1 text-xs">
            <span className="text-muted-foreground">
              {t('Dashboard:TimeWindow.From', { defaultValue: 'From' })}
            </span>
            <input
              type="datetime-local"
              data-slot="dashboard-time-window-from"
              value={draftFrom}
              onChange={(event) => setDraftFrom(event.target.value)}
              className="rounded-md border bg-background px-2.5 py-1.5 text-sm"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs">
            <span className="text-muted-foreground">
              {t('Dashboard:TimeWindow.To', { defaultValue: 'To' })}
            </span>
            <input
              type="datetime-local"
              data-slot="dashboard-time-window-to"
              value={draftTo}
              onChange={(event) => setDraftTo(event.target.value)}
              className="rounded-md border bg-background px-2.5 py-1.5 text-sm"
            />
          </label>
          <button
            type="button"
            data-slot="dashboard-time-window-apply"
            disabled={!customValid}
            onClick={applyCustom}
            className="rounded-md border bg-background px-2.5 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-50"
          >
            {t('Dashboard:TimeWindow.Apply', { defaultValue: 'Apply' })}
          </button>
        </div>
      )}
    </div>
  );
}

/** Shared styling for the flanking icon buttons of the segmented pill. */
const SEGMENT_BUTTON_CLASS =
  'flex items-center px-2.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground';

/** Line-icon wrapper (lucide-style geometry) — keeps the package icon-lib-free. */
function Icon({
  children,
  className,
}: {
  readonly children: ReactNode;
  readonly className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className ?? 'h-4 w-4'}
    >
      {children}
    </svg>
  );
}

function ClockIcon({ className }: { readonly className?: string }) {
  return (
    <Icon className={className}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </Icon>
  );
}

function ChevronDownIcon({ className }: { readonly className?: string }) {
  return (
    <Icon className={className}>
      <path d="m6 9 6 6 6-6" />
    </Icon>
  );
}

function ChevronsLeftIcon() {
  return (
    <Icon>
      <path d="m11 17-5-5 5-5" />
      <path d="m18 17-5-5 5-5" />
    </Icon>
  );
}

function ChevronsRightIcon() {
  return (
    <Icon>
      <path d="m6 17 5-5-5-5" />
      <path d="m13 17 5-5-5-5" />
    </Icon>
  );
}

function ZoomOutIcon() {
  return (
    <Icon>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
      <path d="M8 11h6" />
    </Icon>
  );
}

/** ISO 8601 UTC → `datetime-local` value (`YYYY-MM-DDTHH:mm`) in the browser's local zone. */
function toLocalInput(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function joinClasses(...parts: ReadonlyArray<string | undefined>): string {
  return parts.filter(Boolean).join(' ');
}
