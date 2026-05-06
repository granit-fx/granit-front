import { getActivitiesCalendar, getActivity, listActivities } from '@granit/activities';
import { useQuery } from '@tanstack/react-query';

import { buildActivitiesQueryKey, useActivitiesConfig } from '../providers/activities-provider.js';

import type {
  ActivityCalendarFilter,
  ActivityCalendarItemResponse,
  ActivityListFilter,
  ActivityListResponse,
  ActivityResponse,
} from '@granit/activities';
import type { UseQueryResult } from '@tanstack/react-query';

/**
 * List activities, paginated. The query key includes the serialized `filter`
 * so distinct filter combinations maintain independent caches.
 *
 * @example
 * ```tsx
 * const { data } = useActivities({ status: 'OpenOrOverdue', page: 1, pageSize: 20 });
 * ```
 */
export function useActivities(filter?: ActivityListFilter): UseQueryResult<ActivityListResponse> {
  const config = useActivitiesConfig();
  const baseKey = buildActivitiesQueryKey(config, 'list');
  const queryKey = filter ? [...baseKey, filter] : baseKey;

  return useQuery({
    queryKey,
    queryFn: () => listActivities(config.client, config.basePath, filter),
  });
}

/**
 * Get a single activity by ID. Disabled when `id` is empty.
 *
 * @example
 * ```tsx
 * const { data: activity } = useActivity(selectedId);
 * ```
 */
export function useActivity(id: string): UseQueryResult<ActivityResponse> {
  const config = useActivitiesConfig();

  return useQuery({
    queryKey: buildActivitiesQueryKey(config, 'detail', id),
    queryFn: () => getActivity(config.client, config.basePath, id),
    enabled: id.length > 0,
  });
}

/**
 * Cross-entity calendar window of activities. `from` and `to` are required;
 * other axes (assignee, entityType, type, status) are optional.
 *
 * @example
 * ```tsx
 * const { data } = useActivitiesCalendar({
 *   from: '2026-05-01T00:00:00Z',
 *   to: '2026-05-31T23:59:59Z',
 *   assignee: 'me',
 *   status: 'OpenOrOverdue',
 * });
 * ```
 */
export function useActivitiesCalendar(
  filter: ActivityCalendarFilter
): UseQueryResult<readonly ActivityCalendarItemResponse[]> {
  const config = useActivitiesConfig();

  return useQuery({
    queryKey: buildActivitiesQueryKey(config, 'calendar', filter),
    queryFn: () => getActivitiesCalendar(config.client, config.basePath, filter),
  });
}
