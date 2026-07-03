import { shiftTimeWindow, zoomOutTimeWindow } from '@granit/dashboards';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  TIME_WINDOW_GROUPS as GROUPS,
  TIME_WINDOW_PRESETS as ALL_PRESETS,
} from '../lib/time-window-presets';

import { useDashboardContext } from './dashboard-context';
import {
  ChevronDownIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  ClockIcon,
  joinClasses,
  PILL_CLASS,
  SEGMENT_BUTTON_CLASS,
  ZoomOutIcon,
} from './pill-controls';

/** Sentinel `<select>` value that reveals the absolute-range inputs. */
const CUSTOM_VALUE = '__custom__';

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
      <div role="toolbar" aria-label="Dashboard time window" className={PILL_CLASS}>
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

/** ISO 8601 UTC → `datetime-local` value (`YYYY-MM-DDTHH:mm`) in the browser's local zone. */
function toLocalInput(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
