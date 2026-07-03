import { shiftTimeWindow, zoomOutTimeWindow } from '@granit/dashboards';
import {
  TIME_WINDOW_GROUPS,
  TIME_WINDOW_PRESETS,
  useDashboardContext,
} from '@granit/react-dashboards';
import { useTranslation } from '@granit/react-localization';
import { Popover, PopoverContent, PopoverTrigger } from '@granit/react-ui';
import { cn } from '@granit/utils';
import { ChevronDown, ChevronsLeft, ChevronsRight, Clock, ZoomOut } from 'lucide-react';
import { useState } from 'react';

import type { DashboardTimeWindow } from '@granit/dashboards';

const PILL =
  'inline-flex h-9 items-stretch overflow-hidden rounded-md border bg-background text-sm shadow-sm';
const SEG =
  'flex items-center gap-1.5 px-2.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:bg-accent';

export interface DashboardTimeRangeControlProps {
  readonly className?: string;
}

/**
 * UI-tier Grafana-style time-range picker: a segmented pill (shift « · range
 * picker ▾ · shift » · zoom ⊖) whose picker opens a styled popover with the
 * grouped quick ranges (scrollable) and an absolute From/To range. Consumes the
 * surrounding {@link DashboardContextProvider} from `@granit/react-dashboards`.
 *
 * Unlike the headless `DashboardTimeWindowToolbar` (native `<select>`), this uses
 * the Radix popover for a fully styled menu — same context, so apps swap one for
 * the other freely. Renders nothing when the window is absent or read-only.
 */
export function DashboardTimeRangeControl({ className }: DashboardTimeRangeControlProps) {
  const { t } = useTranslation();
  const ctx = useDashboardContext();

  const period = ctx?.timeWindow?.period;
  const initialAbsolute = period !== undefined && 'from' in period;
  const [open, setOpen] = useState(false);
  const [draftFrom, setDraftFrom] = useState(() => (initialAbsolute ? toLocalInput(period.from) : ''));
  const [draftTo, setDraftTo] = useState(() => (initialAbsolute ? toLocalInput(period.to) : ''));

  if (!ctx?.timeWindow || !ctx.setTimeWindow) return null;

  const { timeWindow, setTimeWindow } = ctx;
  const shiftOptions = { weekStartsOn: ctx.weekStartsOn, timeZone: ctx.timeZone };
  const currentToken = 'token' in timeWindow.period ? timeWindow.period.token : '';
  const activePreset = TIME_WINDOW_PRESETS.find((p) => p.token === currentToken);
  const label = activePreset
    ? t(activePreset.labelKey, { defaultValue: activePreset.defaultLabel })
    : t('Dashboard:TimeWindow.Custom', { defaultValue: 'Custom range' });

  const pickPreset = (window: DashboardTimeWindow) => {
    setTimeWindow({ ...timeWindow, ...window });
    setOpen(false);
  };

  const applyCustom = () => {
    const from = new Date(draftFrom);
    const to = new Date(draftTo);
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from >= to) return;
    setTimeWindow({ period: { from: from.toISOString(), to: to.toISOString() } });
    setOpen(false);
  };

  const customValid = draftFrom !== '' && draftTo !== '' && new Date(draftFrom) < new Date(draftTo);

  return (
    <div data-slot="dashboard-time-range-control" className={cn(PILL, className)} role="toolbar" aria-label="Dashboard time window">
      <button
        type="button"
        data-slot="time-range-back"
        aria-label={t('Dashboard:TimeWindow.ShiftBack', { defaultValue: 'Shift earlier' })}
        onClick={() => setTimeWindow(shiftTimeWindow(timeWindow, 'back', shiftOptions))}
        className={SEG}
      >
        <ChevronsLeft className="h-4 w-4" aria-hidden />
      </button>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            data-slot="time-range-trigger"
            className={cn(SEG, 'border-l font-medium text-foreground')}
          >
            <Clock className="h-4 w-4 text-muted-foreground" aria-hidden />
            <span>{label}</span>
            <ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden />
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="flex w-[36rem] max-w-[calc(100vw-2rem)] gap-4 p-4">
          {/* Absolute range */}
          <div className="flex w-1/2 flex-col gap-2">
            <p className="text-xs font-medium text-muted-foreground">
              {t('Dashboard:TimeWindow.AbsoluteRange', { defaultValue: 'Absolute time range' })}
            </p>
            <label className="flex flex-col gap-1 text-xs">
              <span className="text-muted-foreground">
                {t('Dashboard:TimeWindow.From', { defaultValue: 'From' })}
              </span>
              <input
                type="datetime-local"
                data-slot="time-range-from"
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
                data-slot="time-range-to"
                value={draftTo}
                onChange={(event) => setDraftTo(event.target.value)}
                className="rounded-md border bg-background px-2.5 py-1.5 text-sm"
              />
            </label>
            <button
              type="button"
              data-slot="time-range-apply"
              disabled={!customValid}
              onClick={applyCustom}
              className="mt-1 self-start rounded-md border bg-background px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-50"
            >
              {t('Dashboard:TimeWindow.Apply', { defaultValue: 'Apply' })}
            </button>
          </div>

          {/* Quick ranges — scrollable with the thin overlay scrollbar. */}
          <div className="scrollbar-overlay max-h-72 w-1/2 overflow-y-auto border-l pl-4">
            {TIME_WINDOW_GROUPS.map((group) => (
              <div key={group.labelKey} className="mb-2 last:mb-0">
                <p className="px-1 py-1 text-[0.7rem] font-medium uppercase tracking-wide text-muted-foreground">
                  {t(group.labelKey, { defaultValue: group.defaultLabel })}
                </p>
                {group.presets.map((p) => {
                  const active = p.token === currentToken;
                  return (
                    <button
                      key={p.token}
                      type="button"
                      data-slot="time-range-preset"
                      data-token={p.token}
                      aria-current={active}
                      onClick={() => pickPreset(p.window)}
                      className={cn(
                        'block w-full rounded-md px-2 py-1 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground',
                        active && 'bg-accent font-medium text-accent-foreground'
                      )}
                    >
                      {t(p.labelKey, { defaultValue: p.defaultLabel })}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      <button
        type="button"
        data-slot="time-range-forward"
        aria-label={t('Dashboard:TimeWindow.ShiftForward', { defaultValue: 'Shift later' })}
        onClick={() => setTimeWindow(shiftTimeWindow(timeWindow, 'forward', shiftOptions))}
        className={cn(SEG, 'border-l')}
      >
        <ChevronsRight className="h-4 w-4" aria-hidden />
      </button>
      <button
        type="button"
        data-slot="time-range-zoom-out"
        aria-label={t('Dashboard:TimeWindow.ZoomOut', { defaultValue: 'Zoom out' })}
        onClick={() => setTimeWindow(zoomOutTimeWindow(timeWindow, shiftOptions))}
        className={cn(SEG, 'border-l')}
      >
        <ZoomOut className="h-4 w-4" aria-hidden />
      </button>
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
