// ---------------------------------------------------------------------------
// @granit/react-activities/testing — MSW handlers mirroring the
// Granit.Activities.Endpoints HTTP contract (/api/v1/activities).
// ---------------------------------------------------------------------------

import { notFound } from '@granit/testing/msw';
import { http, HttpResponse } from 'msw';

import { DEFAULT_BASE_PATH } from '../constants';

import { mockActivities, mockActivityCalendarItems } from './data';

import type { ActivityResponse, CreateActivityRequest } from '@granit/activities';
import type { Mutable } from '@granit/testing';

/**
 * Create stateful MSW handlers for the activities endpoints. Handlers mutate an
 * in-memory copy of {@link mockActivities}, so writes (create / complete /
 * cancel / reassign / reschedule) are reflected by subsequent reads. The
 * completion / cancellation timestamps are resolved here, mirroring the
 * server's audit-integrity behaviour (clients never supply them).
 *
 * @param baseUrl - API base path (default: `/api/v1/activities`)
 */
export function createActivitiesHandlers(baseUrl = DEFAULT_BASE_PATH) {
  const activities: Mutable<ActivityResponse>[] = mockActivities.map((a) => ({ ...a }));
  const MOCK_ACTOR = mockActivities[0]?.assignedToUserId ?? 'mock-user';

  const find = (id: unknown): Mutable<ActivityResponse> | undefined =>
    activities.find((a) => a.id === id);

  return [
    // Calendar must precede `/:id` — otherwise `:id` captures `calendar`.
    http.get(`${baseUrl}/calendar`, () => HttpResponse.json(mockActivityCalendarItems)),

    http.get(`${baseUrl}/:id`, ({ params }) => {
      const activity = find(params.id);
      return activity ? HttpResponse.json(activity) : notFound();
    }),

    http.get(baseUrl, ({ request }) => {
      const url = new URL(request.url);
      const page = Number(url.searchParams.get('page') ?? '1');
      const pageSize = Number(url.searchParams.get('pageSize') ?? '20');
      const start = (page - 1) * pageSize;
      return HttpResponse.json({
        items: activities.slice(start, start + pageSize),
        totalCount: activities.length,
        page,
        pageSize,
      });
    }),

    http.post(baseUrl, async ({ request }) => {
      const body = (await request.json()) as CreateActivityRequest;
      const created: ActivityResponse = {
        id: `act_${Date.now()}`,
        entityType: body.entityType,
        entityId: body.entityId,
        type: body.type,
        assignedToUserId: body.assignedToUserId,
        createdByUserId: MOCK_ACTOR,
        dueAt: body.dueAt,
        description: body.description ?? null,
        status: 'Open',
        completedAt: null,
        completedByUserId: null,
        createdAt: new Date().toISOString(),
      };
      activities.unshift({ ...created });
      return HttpResponse.json(created, { status: 201 });
    }),

    http.post(`${baseUrl}/:id/complete`, ({ params }) => {
      const activity = find(params.id);
      if (!activity) return notFound();
      activity.status = 'Done';
      activity.completedAt = new Date().toISOString();
      activity.completedByUserId = MOCK_ACTOR;
      return HttpResponse.json(activity);
    }),

    http.post(`${baseUrl}/:id/cancel`, ({ params }) => {
      const activity = find(params.id);
      if (!activity) return notFound();
      activity.status = 'Cancelled';
      return HttpResponse.json(activity);
    }),

    http.put(`${baseUrl}/:id/assignee`, async ({ params, request }) => {
      const activity = find(params.id);
      if (!activity) return notFound();
      const body = (await request.json()) as { newAssigneeUserId: string };
      activity.assignedToUserId = body.newAssigneeUserId;
      return HttpResponse.json(activity);
    }),

    http.put(`${baseUrl}/:id/due-date`, async ({ params, request }) => {
      const activity = find(params.id);
      if (!activity) return notFound();
      const body = (await request.json()) as { newDueAt: string };
      activity.dueAt = body.newDueAt;
      return HttpResponse.json(activity);
    }),
  ];
}
