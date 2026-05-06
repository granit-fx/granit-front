import { useMemo, useState, type ReactNode } from 'react';

import { useActivitiesCalendar } from '../hooks/use-activities.js';

import type { ActivityCalendarFilter, ActivityCalendarItemResponse } from '@granit/activities';

export type ActivityCalendarView = 'day' | 'week' | 'month';

export interface ActivityCalendarLabels {
  readonly previous?: string;
  readonly next?: string;
  readonly today?: string;
  readonly day?: string;
  readonly week?: string;
  readonly month?: string;
}

const DEFAULT_LABELS: Required<ActivityCalendarLabels> = {
  previous: 'Previous',
  next: 'Next',
  today: 'Today',
  day: 'Day',
  week: 'Week',
  month: 'Month',
};

export interface ActivityCalendarProps {
  /** Initial view mode (default: 'week'). */
  readonly initialView?: ActivityCalendarView;
  /** Initial anchor date (default: now). Window is computed around this anchor. */
  readonly initialAnchor?: Date;
  /** Server-side filters (assignee / entityType / type / status). `from` / `to` are computed from the anchor + view. */
  readonly filter?: Omit<ActivityCalendarFilter, 'from' | 'to'>;
  /** Click handler — apps typically open their detail panel here. */
  readonly onItemClick?: (item: ActivityCalendarItemResponse) => void;
  /** Override English defaults for header / view-switcher labels (i18n in F9). */
  readonly labels?: ActivityCalendarLabels;
  readonly className?: string;
}

/**
 * Headless cross-entity activity calendar. Consumes
 * {@link useActivitiesCalendar}; the time window is computed from the
 * current view + anchor. Items are rendered grouped by day with
 * `data-granit-activity-calendar-*` markers — apps style via `className`
 * + the `data-*` attributes.
 *
 * Color is **server-supplied** (`'open' | 'overdue' | 'done' | 'cancelled'`)
 * and exposed verbatim as `data-activity-color` — never recomputed
 * client-side. Title is also server-composed.
 *
 * Drag-to-reschedule is intentionally out of scope: apps wire it through
 * `useRescheduleActivity` against their own pointer/drag primitives.
 */
export function ActivityCalendar({
  initialView = 'week',
  initialAnchor,
  filter,
  onItemClick,
  labels,
  className,
}: ActivityCalendarProps): ReactNode {
  const [view, setView] = useState<ActivityCalendarView>(initialView);
  const [anchor, setAnchor] = useState<Date>(() => initialAnchor ?? new Date());
  const merged = { ...DEFAULT_LABELS, ...labels };

  const window = useMemo(() => computeWindow(anchor, view), [anchor, view]);

  const query = useActivitiesCalendar({
    ...filter,
    from: window.from.toISOString(),
    to: window.to.toISOString(),
  });

  const days = useMemo(() => groupByDay(query.data ?? [], window), [query.data, window]);

  return (
    <div data-granit-activity-calendar="" data-activity-calendar-view={view} className={className}>
      <div data-granit-activity-calendar-header="">
        <button
          type="button"
          onClick={() => setAnchor((a) => shiftAnchor(a, view, -1))}
          aria-label={merged.previous}
        >
          ‹
        </button>
        <button type="button" onClick={() => setAnchor(new Date())}>
          {merged.today}
        </button>
        <button
          type="button"
          onClick={() => setAnchor((a) => shiftAnchor(a, view, 1))}
          aria-label={merged.next}
        >
          ›
        </button>
        <span data-granit-activity-calendar-range="">
          {window.from.toISOString().slice(0, 10)} → {window.to.toISOString().slice(0, 10)}
        </span>
        <div data-granit-activity-calendar-view-switcher="" role="group" aria-label="View">
          {(['day', 'week', 'month'] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              aria-pressed={view === v}
              data-active={view === v ? '' : undefined}
            >
              {merged[v]}
            </button>
          ))}
        </div>
      </div>

      {query.isLoading ? (
        <div data-granit-activity-calendar-loading="">Loading…</div>
      ) : query.isError ? (
        <div data-granit-activity-calendar-error="" role="alert">
          {query.error?.message ?? 'Failed to load calendar.'}
        </div>
      ) : days.length === 0 || days.every((d) => d.items.length === 0) ? (
        <div data-granit-activity-calendar-empty="">No activities in this window.</div>
      ) : (
        <ol data-granit-activity-calendar-grid="">
          {days.map((d) => (
            <li
              key={d.iso}
              data-granit-activity-calendar-day=""
              data-activity-calendar-date={d.iso}
            >
              <header>{d.iso}</header>
              <ul data-granit-activity-calendar-items="">
                {d.items.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      data-granit-activity-calendar-item=""
                      data-activity-id={item.id}
                      data-activity-color={item.color}
                      data-activity-status={item.status}
                      onClick={onItemClick ? () => onItemClick(item) : undefined}
                    >
                      {item.title}
                    </button>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

interface CalendarWindow {
  readonly from: Date;
  readonly to: Date;
}

interface CalendarDay {
  readonly iso: string;
  readonly items: readonly ActivityCalendarItemResponse[];
}

/** Compute a [from, to) window for the given anchor + view, in UTC. */
function computeWindow(anchor: Date, view: ActivityCalendarView): CalendarWindow {
  const a = new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth(), anchor.getUTCDate()));
  if (view === 'day') {
    return { from: a, to: addDays(a, 1) };
  }
  if (view === 'week') {
    // Monday-anchored. JS getUTCDay: Sun=0..Sat=6 → Mon offset.
    const dow = a.getUTCDay();
    const offset = (dow + 6) % 7; // Mon → 0, Tue → 1, …, Sun → 6
    const from = addDays(a, -offset);
    return { from, to: addDays(from, 7) };
  }
  // month
  const from = new Date(Date.UTC(a.getUTCFullYear(), a.getUTCMonth(), 1));
  const to = new Date(Date.UTC(a.getUTCFullYear(), a.getUTCMonth() + 1, 1));
  return { from, to };
}

function addDays(d: Date, days: number): Date {
  const next = new Date(d.getTime());
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function shiftAnchor(anchor: Date, view: ActivityCalendarView, direction: 1 | -1): Date {
  if (view === 'day') return addDays(anchor, direction);
  if (view === 'week') return addDays(anchor, 7 * direction);
  // month
  return new Date(
    Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth() + direction, anchor.getUTCDate())
  );
}

function groupByDay(
  items: readonly ActivityCalendarItemResponse[],
  window: CalendarWindow
): readonly CalendarDay[] {
  const buckets = new Map<string, ActivityCalendarItemResponse[]>();

  // Pre-seed every day in the window so empty days still render with a header.
  for (let d = new Date(window.from); d < window.to; d = addDays(d, 1)) {
    buckets.set(d.toISOString().slice(0, 10), []);
  }

  for (const item of items) {
    const iso = item.start.slice(0, 10);
    const bucket = buckets.get(iso);
    if (bucket) {
      bucket.push(item);
    }
  }

  return [...buckets.entries()]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([iso, dayItems]) => ({ iso, items: dayItems }));
}
