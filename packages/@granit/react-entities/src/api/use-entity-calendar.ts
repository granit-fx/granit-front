import { useGranitClient } from '@granit/react-api-client';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import type { CalendarItemResponse } from '@granit/entities';

/**
 * Cache key for one calendar range query. Keyed by
 * `(entityName, from, to, calendar)` so distinct windows or
 * named-calendar selections don't collide. Calling
 * `queryClient.invalidateQueries({ queryKey: ['entities', 'calendar', entityName] })`
 * blasts every cached window for one entity, which is what apps typically
 * want after a relevant mutation.
 */
export function entityCalendarQueryKey(
  entityName: string,
  from: string,
  to: string,
  calendar?: string | null
): readonly ['entities', 'calendar', string, string, string, string | null] {
  return ['entities', 'calendar', entityName, from, to, calendar ?? null] as const;
}

/**
 * `GET /entities/{name}/calendar?from=&to=&calendar=` — returns calendar
 * items whose start/end overlaps `[from, to]`. Mirrors
 * `Granit.Entities.Endpoints.CalendarRangeEndpoint.HandleAsync`.
 *
 * `from` / `to` are ISO 8601 datetime offset strings — the same shape the
 * .NET handler binds via `[AsParameters] CalendarRangeRequest`. Apps
 * typically build them by serialising the renderer's current visible
 * window; the server enforces `to >= from` and a 366-day cap and surfaces
 * out-of-range windows as 400 ValidationProblem.
 *
 * Pass `calendar` to disambiguate when the entity declares multiple
 * calendar layouts; omitted when there's only one (the common case
 * today). The cache key splits per `(from, to, calendar)` so paging the
 * window forward keeps prior tiles cached for back-navigation.
 *
 * The handler returns an empty array — not 404 — when the entity has no
 * calendar layout, so the renderer can mount the endpoint generically
 * from the manifest without special-casing missing layouts.
 */
export function useEntityCalendar(
  entityName: string,
  from: string,
  to: string,
  options: { readonly calendar?: string | null; readonly enabled?: boolean } = {}
): UseQueryResult<readonly CalendarItemResponse[]> {
  const api = useGranitClient();
  const calendar = options.calendar ?? null;

  return useQuery({
    queryKey: entityCalendarQueryKey(entityName, from, to, calendar),
    queryFn: async ({ signal }) => {
      const params: Record<string, string> = { from, to };
      if (calendar) {
        params.calendar = calendar;
      }
      const { data } = await api.get<readonly CalendarItemResponse[]>(
        `/entities/${encodeURIComponent(entityName)}/calendar`,
        { params, signal }
      );
      return data;
    },
    enabled: (options.enabled ?? true) && Boolean(entityName) && Boolean(from) && Boolean(to),
    staleTime: 30_000,
  });
}
