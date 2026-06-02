import { useQueryEndpointState } from '@granit/react-query-engine';
import { useMemo, type ReactNode } from 'react';

import { EntityActionButton, resolveAction } from '../actions/entity-action-button';
import {
  useEntityActionDispatcher,
  type EntityActionHandlers,
} from '../actions/use-entity-action-dispatcher';
import { useEntityCalendar } from '../hooks/use-entity-calendar';

import type {
  CalendarItemResponse,
  EntityActionManifest,
  EntityCalendarLayoutManifest,
  EntityManifestResponse,
} from '@granit/entities';

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
  /**
   * Optional manifest — when provided, the calendar resolves the
   * compact `layout.actions` references to the full descriptors in
   * `manifest.actions` and paints icon-buttons on each tile. Omit it
   * (or omit the `actions` facet on the manifest) to render the
   * tiles without action affordances.
   */
  readonly manifest?: EntityManifestResponse;
  /**
   * Per-kind handler overrides forwarded to
   * `useEntityActionDispatcher`. Apps with SPA routers / workflow
   * runtimes wire `navigate` / `workflowTransition` here so tile
   * action buttons execute through the host's stack.
   */
  readonly actionHandlers?: EntityActionHandlers;
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
 *
 * When wrapped in a `<QueryEndpointStateProvider>`, automatically
 * forwards the ambient `filter` and `search` to the calendar range
 * endpoint so SmartFilterBar tokens narrow which events surface
 * inside the visible window. `sort` / `groupBy` / `page` / `pageSize`
 * are deliberately ignored — they have no meaning on a time-axis
 * layout (the time-axis IS the bucketing).
 */
export function EntityCalendar({
  entityName,
  layout,
  range,
  calendar,
  onItemClick,
  manifest,
  actionHandlers,
  className,
}: EntityCalendarProps): ReactNode {
  // Per the Phase 1.5 renderer matrix the calendar consumes only
  // `filter` and `search` from ambient query state — `sort`, `groupBy`,
  // `page`, `pageSize` have no meaning on a time-axis layout. The
  // visible window stays owned by `range`.
  const { params } = useQueryEndpointState();
  const query = useEntityCalendar(entityName, range.from, range.to, {
    calendar,
    filters: params.filters,
    search: params.search,
  });
  const days = useMemo(() => groupItemsByStartDay(query.data ?? []), [query.data]);
  const dispatch = useEntityActionDispatcher(actionHandlers);
  const tileActions = useMemo<readonly EntityActionManifest[]>(() => {
    if (!manifest?.actions || layout.actions.length === 0) return [];
    const resolved: EntityActionManifest[] = [];
    for (const ref of layout.actions) {
      const action = resolveAction(ref, manifest.actions);
      if (action) resolved.push(action);
    }
    return resolved;
  }, [layout.actions, manifest?.actions]);

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
                  >
                    {onItemClick ? (
                      <button
                        type="button"
                        onClick={() => onItemClick(event)}
                        style={{
                          cursor: 'pointer',
                          background: 'transparent',
                          border: 0,
                          padding: 0,
                          textAlign: 'left',
                          font: 'inherit',
                          color: 'inherit',
                          width: '100%',
                        }}
                      >
                        {event.title}
                      </button>
                    ) : (
                      event.title
                    )}
                    {tileActions.length > 0 ? (
                      <div data-granit-calendar-event-actions="">
                        {tileActions.map((action) => (
                          <EntityActionButton
                            key={action.name}
                            action={action}
                            rowId={event.id}
                            row={{ ...event }}
                            dispatch={dispatch}
                          />
                        ))}
                      </div>
                    ) : null}
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
