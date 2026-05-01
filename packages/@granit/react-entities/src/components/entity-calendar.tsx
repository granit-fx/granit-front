import { useMemo, type ReactNode } from 'react';

import { useEntityCalendar } from '../api/use-entity-calendar.js';

import type { CalendarItemResponse, EntityCalendarLayoutManifest } from '@granit/entities';

export interface EntityCalendarProps {
  /** Wire identifier of the entity (e.g. `"Granit.Invoicing.Invoice"`). */
  readonly entityName: string;
  /**
   * Calendar layout from the manifest (one of
   * `manifest.collections.listLayouts` whose `kind === 'Calendar'`). The
   * renderer reads `startPropertyName` etc. to surface them as data
   * attributes; the actual values come from
   * `useEntityCalendar`'s response and are already projected server-side.
   */
  readonly layout: EntityCalendarLayoutManifest;
  /**
   * Visible window — ISO 8601 datetime offset strings. The host owns the
   * window state (a "next month" button lives in the host's toolbar, not
   * in the framework); the renderer just paints what falls inside.
   */
  readonly range: { readonly from: string; readonly to: string };
  /**
   * Optional name selector when the entity declares more than one
   * calendar layout. Reserved for future kinds — leave undefined today.
   */
  readonly calendar?: string;
  /** Optional event activation handler — receives the full item. */
  readonly onItemClick?: (item: CalendarItemResponse) => void;
  /** Optional class for the root element. */
  readonly className?: string;
}

/**
 * Generic read-only calendar renderer. Bridges the entity manifest's
 * calendar layout to the `GET /entities/{name}/calendar` range endpoint
 * via `useEntityCalendar`, then paints the result as a flat agenda
 * grouped by start-day:
 *
 * ```html
 * <div data-granit-entity-calendar data-entity="…" data-from="…" data-to="…">
 *   <ol data-granit-calendar-days>
 *     <li data-granit-calendar-day data-day="2026-05-04">
 *       <ol data-granit-calendar-events>
 *         <li data-granit-calendar-event
 *             data-event-id="…"
 *             data-start="…" data-end="…"
 *             data-color="Blue">
 *           INV-001
 *         </li>
 *       </ol>
 *     </li>
 *   </ol>
 * </div>
 * ```
 *
 * Apps style the day cells via CSS (typically a 7-column grid) and read
 * `data-start` / `data-end` on the event nodes to position multi-day
 * events. Multi-day events appear only in their start-day bucket — the
 * spanning visualisation is the host's responsibility, not the
 * framework's. Showing a richer month / week / day grid (with padding
 * cells, cross-day spans, drag-and-drop) is a follow-up; this story
 * ships the data path + a structured DOM scaffold deliberately neutral
 * about visual layout.
 *
 * Loading / error / empty states surface via dedicated data attributes
 * (`data-granit-calendar-loading`, `…-error`, `…-empty`) so apps can
 * render their own placeholders without inspecting React state.
 */
export function EntityCalendar({
  entityName,
  layout,
  range,
  calendar,
  onItemClick,
  className,
}: EntityCalendarProps): ReactNode {
  const query = useEntityCalendar(entityName, range.from, range.to, { calendar });
  const days = useMemo(() => groupItemsByStartDay(query.data ?? []), [query.data]);

  if (query.isError) {
    return (
      <div
        data-granit-entity-calendar=""
        data-granit-calendar-error=""
        data-entity={entityName}
        role="alert"
        className={className}
      >
        {String(query.error?.message ?? 'Failed to load')}
      </div>
    );
  }

  if (query.isLoading) {
    return (
      <div
        data-granit-entity-calendar=""
        data-granit-calendar-loading=""
        data-entity={entityName}
        className={className}
      />
    );
  }

  return (
    <div
      data-granit-entity-calendar=""
      data-entity={entityName}
      data-from={range.from}
      data-to={range.to}
      data-start-property={layout.startPropertyName}
      data-end-property={layout.endPropertyName ?? undefined}
      data-color-property={layout.colorByPropertyName ?? undefined}
      className={className}
    >
      {days.length === 0 ? (
        <div data-granit-calendar-empty="" />
      ) : (
        <ol data-granit-calendar-days="">
          {days.map(({ day, events }) => (
            <li key={day} data-granit-calendar-day="" data-day={day}>
              <ol data-granit-calendar-events="">
                {events.map((event) => (
                  <li
                    key={event.id}
                    data-granit-calendar-event=""
                    data-event-id={event.id}
                    data-start={event.start}
                    data-end={event.end ?? undefined}
                    data-color={event.color ?? undefined}
                    onClick={onItemClick ? () => onItemClick(event) : undefined}
                    style={onItemClick ? { cursor: 'pointer' } : undefined}
                  >
                    {event.title}
                  </li>
                ))}
              </ol>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

interface CalendarDay {
  readonly day: string;
  readonly events: readonly CalendarItemResponse[];
}

/**
 * Buckets items by start-day (`YYYY-MM-DD`) keeping declaration order
 * within a day, then sorts the day list ascending. Multi-day events
 * appear only in their start-day bucket; consumers reconstruct the
 * spanning cells by reading `data-end` on the event node.
 */
function groupItemsByStartDay(items: readonly CalendarItemResponse[]): readonly CalendarDay[] {
  const buckets = new Map<string, CalendarItemResponse[]>();
  for (const item of items) {
    const day = startDay(item.start);
    let bucket = buckets.get(day);
    if (!bucket) {
      bucket = [];
      buckets.set(day, bucket);
    }
    bucket.push(item);
  }
  return Array.from(buckets, ([day, events]) => ({ day, events })).sort((a, b) =>
    a.day.localeCompare(b.day)
  );
}

function startDay(iso: string): string {
  // Cheap path — ISO 8601 always emits `YYYY-MM-DD` as the first ten chars.
  return iso.slice(0, 10);
}
