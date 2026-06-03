import { useGranitClient } from '@granit/react-api-client';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';

export { entityCalendarQueryKey } from './query-keys';
import { entityCalendarQueryKey } from './query-keys';

import type { CalendarItemResponse } from '@granit/entities';
import type { FilterEntry } from '@granit/query-engine';

export interface UseEntityCalendarOptions {
  /**
   * Optional name selector when the entity declares more than one
   * calendar layout. Reserved for future kinds — leaving `null`
   * always picks the entity's single calendar today.
   */
  readonly calendar?: string | null;
  readonly enabled?: boolean;
  /**
   * Filter entries forwarded as `filter[field.op]=value` query params.
   * Filters narrow the events surfaced inside the visible window;
   * the time bounds remain owned by `from` / `to`. Per the Phase 1.5
   * matrix, the calendar endpoint accepts the same filter wire shape
   * as the standard list endpoint.
   */
  readonly filters?: readonly FilterEntry[];
  /**
   * Free-text search forwarded as `search=…`. Same role as `filters`
   * — narrows the events inside the visible window.
   */
  readonly search?: string;
}

/**
 * `GET /entities/{name}/calendar?from=&to=&calendar=&filter[…]=&search=`
 * — returns calendar items whose start/end overlaps `[from, to]`,
 * narrowed by the optional filter / search criteria. Mirrors
 * `Granit.Entities.Endpoints.CalendarRangeEndpoint.HandleAsync`.
 *
 * `from` / `to` are ISO 8601 datetime offset strings — the same shape
 * the .NET handler binds via `[AsParameters] CalendarRangeRequest`.
 * The server enforces `to >= from` and a 366-day cap and surfaces
 * out-of-range windows as 400 ValidationProblem.
 *
 * `filters` / `search` follow the standard list endpoint's wire shape
 * (`filter[field.op]=value`, `search=…`); per the Phase 1.5 renderer
 * matrix they narrow which events surface inside the visible window
 * but never widen / shift the window itself. `sort` / `groupBy` /
 * `page` / `pageSize` have no meaning on a time-axis layout and are
 * deliberately not part of the request shape.
 *
 * Pass `calendar` to disambiguate when the entity declares multiple
 * calendar layouts; omitted when there's only one (the common case
 * today). The cache key splits per
 * `(from, to, calendar, filters, search)` so paging the window
 * forward keeps prior tiles cached for back-navigation and toggling
 * a filter doesn't invalidate other windows.
 *
 * The handler returns an empty array — not 404 — when the entity has
 * no calendar layout, so the renderer can mount the endpoint
 * generically from the manifest without special-casing missing
 * layouts.
 */
export function useEntityCalendar(
  entityName: string,
  from: string,
  to: string,
  options: UseEntityCalendarOptions = {}
): UseQueryResult<readonly CalendarItemResponse[]> {
  const api = useGranitClient();
  const calendar = options.calendar ?? null;
  const filters = options.filters;
  const search = options.search;

  return useQuery({
    queryKey: entityCalendarQueryKey(entityName, from, to, calendar, filters, search),
    queryFn: async ({ signal }) => {
      const params = new URLSearchParams();
      params.set('from', from);
      params.set('to', to);
      if (calendar) params.set('calendar', calendar);
      if (search) params.set('search', search);
      if (filters) {
        for (const filter of filters) {
          params.append(`filter[${filter.field}.${filter.operator}]`, filter.value);
        }
      }
      const { data } = await api.get<readonly CalendarItemResponse[]>(
        `/api/v1/entities/${encodeURIComponent(entityName)}/calendar`,
        { params, signal }
      );
      return data;
    },
    enabled: (options.enabled ?? true) && Boolean(entityName) && Boolean(from) && Boolean(to),
    staleTime: 30_000,
  });
}
