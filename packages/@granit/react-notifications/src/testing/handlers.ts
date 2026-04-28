import { DATE_OPERATORS, ENUM_OPERATORS, STRING_OPERATORS } from '@granit/query-engine';
import { createQueryMetaHandler } from '@granit/react-query-engine/testing';
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
import type { QueryMetadata } from '@granit/query-engine';
import type { Mutable } from '@granit/testing';

const NOTIFICATION_SEVERITIES = ['Info', 'Success', 'Warning', 'Error', 'Fatal'];
const NOTIFICATION_STATES = ['Unread', 'Read'];

/** Mock /meta payload for the user-notifications resource. */
export const notificationQueryMetadata: QueryMetadata = {
  columns: [
    {
      name: 'id',
      label: 'ID',
      type: 'Guid',
      order: 0,
      isSortable: false,
      isFilterable: false,
      isVisible: false,
    },
    {
      name: 'notificationTypeName',
      label: 'Type',
      type: 'String',
      order: 1,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'severity',
      label: 'Severity',
      type: 'String',
      order: 2,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'state',
      label: 'State',
      type: 'String',
      order: 3,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'relatedEntityType',
      label: 'Related entity',
      type: 'String',
      order: 4,
      isSortable: false,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'relatedEntityId',
      label: 'Related id',
      type: 'String',
      order: 5,
      isSortable: false,
      isFilterable: true,
      isVisible: false,
    },
    {
      name: 'recipientUserId',
      label: 'Recipient',
      type: 'Guid',
      order: 6,
      isSortable: false,
      isFilterable: true,
      isVisible: false,
    },
    {
      name: 'createdAt',
      label: 'Created at',
      type: 'DateTime',
      order: 7,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'readAt',
      label: 'Read at',
      type: 'DateTime',
      order: 8,
      isSortable: true,
      isFilterable: true,
      isVisible: false,
    },
  ],
  filterableFields: [
    { name: 'notificationTypeName', type: 'String', operators: STRING_OPERATORS },
    {
      name: 'severity',
      type: 'String',
      operators: ENUM_OPERATORS,
      enumValues: NOTIFICATION_SEVERITIES,
    },
    { name: 'state', type: 'String', operators: ENUM_OPERATORS, enumValues: NOTIFICATION_STATES },
    { name: 'relatedEntityType', type: 'String', operators: STRING_OPERATORS },
    { name: 'relatedEntityId', type: 'String', operators: STRING_OPERATORS },
    { name: 'recipientUserId', type: 'Guid', operators: ENUM_OPERATORS },
    { name: 'createdAt', type: 'DateTime', operators: DATE_OPERATORS },
    { name: 'readAt', type: 'DateTime', operators: DATE_OPERATORS },
  ],
  sortableFields: [
    { name: 'notificationTypeName' },
    { name: 'severity' },
    { name: 'state' },
    { name: 'createdAt' },
    { name: 'readAt' },
  ],
  presetFilterGroups: [],
  quickFilters: [
    { name: 'unread', label: 'Unread', isDefault: true },
    { name: 'read', label: 'Read', isDefault: false },
  ],
  dateFilters: [
    {
      name: 'createdAt',
      defaultPeriod: 'ThisMonth',
      availablePeriods: ['Today', 'ThisWeek', 'ThisMonth', 'LastMonth', 'Custom'],
    },
  ],
  groupByFields: [
    { name: 'severity', type: 'String' },
    { name: 'notificationTypeName', type: 'String' },
    { name: 'state', type: 'String' },
  ],
  pagination: {
    defaultPageSize: 20,
    maxPageSize: 100,
    maxStreamSize: 10_000,
    supportsCursor: false,
  },
  defaultSort: '-createdAt',
};

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
    // GET /notifications/meta — query metadata
    createQueryMetaHandler(`${baseUrl}/notifications`, notificationQueryMetadata),

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
