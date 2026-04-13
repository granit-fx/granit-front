import { noContent, notFound } from '@granit/testing/msw';
import { toISODateString } from '@granit/types';
import { http, HttpResponse } from 'msw';

import { API_BASE_PATH } from '../constants.js';

import { mockNotificationPreferences, mockNotifications } from './data.js';

import type {
  NotificationPreference,
  UserNotification,
  UserNotificationPage,
} from '@granit/notifications';
import type { Mutable } from '@granit/testing';

/**
 * Create stateful MSW handlers for notification endpoints.
 * Handlers mutate in-memory arrays — mark-read / mark-all-read / preference
 * updates are reflected in subsequent GET calls.
 *
 * @param baseUrl - API base path (default: `/api/v1`)
 */
export function createNotificationsHandlers(baseUrl = API_BASE_PATH) {
  let notifications: Mutable<UserNotification>[] = [...mockNotifications];
  let preferences: Mutable<NotificationPreference>[] = [...mockNotificationPreferences];

  return [
    // SSE stream — open connection that sends a heartbeat comment
    http.get(`${baseUrl}/notifications/stream`, () => {
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(': heartbeat\n\n'));
        },
      });
      return new HttpResponse(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      });
    }),

    // GET paginated notifications (skip/take)
    http.get(`${baseUrl}/notifications`, ({ request }) => {
      const url = new URL(request.url);
      const skip = Number(url.searchParams.get('skip') ?? 0);
      const take = Number(url.searchParams.get('take') ?? 20);

      const sorted = [...notifications].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      const response: UserNotificationPage = {
        items: sorted.slice(skip, skip + take),
        totalCount: sorted.length,
        nextCursor: null,
        unreadCount: sorted.filter((n) => n.state === 'Unread').length,
      };

      return HttpResponse.json(response);
    }),

    // GET unread count
    http.get(`${baseUrl}/notifications/unread/count`, () => {
      const count = notifications.filter((n) => n.state === 'Unread').length;
      return HttpResponse.json({ count });
    }),

    // POST mark as read
    http.post(`${baseUrl}/notifications/:id/read`, ({ params }) => {
      const id = params.id as string;
      const notif = notifications.find((n) => n.id === id);
      if (!notif) return notFound();

      notif.state = 'Read';
      notif.readAt = toISODateString(new Date().toISOString());

      return noContent();
    }),

    // POST mark all as read
    http.post(`${baseUrl}/notifications/read-all`, () => {
      const now = toISODateString(new Date().toISOString());
      notifications = notifications.map((n) =>
        n.state === 'Unread' ? { ...n, state: 'Read' as const, readAt: now } : n
      );
      return noContent();
    }),

    // GET notification preferences
    http.get(`${baseUrl}/notifications/preferences`, () => {
      return HttpResponse.json(preferences);
    }),

    // PUT update notification preference
    http.put(`${baseUrl}/notifications/preferences`, async ({ request }) => {
      const body = (await request.json()) as NotificationPreference;
      const index = preferences.findIndex((p) => p.id === body.id);

      if (index === -1) {
        preferences = [...preferences, { ...body }];
        return HttpResponse.json(body);
      }

      const updated: Mutable<NotificationPreference> = { ...preferences[index], ...body };
      preferences = preferences.map((p) => (p.id === body.id ? updated : p));
      return HttpResponse.json(updated);
    }),
  ];
}
