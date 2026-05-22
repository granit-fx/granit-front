import { toISODateString } from '@granit/types';
import { http, HttpResponse } from 'msw';

import { DEFAULT_BASE_PATH } from '../constants.js';

import { mockMyPresence, mockOtherPresences } from './data.js';

import type {
  BatchPresenceRequest,
  BatchPresenceResponse,
  HeartbeatRequest,
  ManualPresenceStatus,
  PresenceResponse,
  PresenceStatus,
  SetPresenceRequest,
} from '@granit/presence';
import type { UserId } from '@granit/types';

type Mutable<T> = { -readonly [P in keyof T]: T[P] };

function recomputeEffective(
  override: ManualPresenceStatus | null,
  lastIdleSeconds: number
): PresenceStatus {
  if (override === 'AppearOffline') return 'Offline';
  if (override === 'DoNotDisturb') return 'DoNotDisturb';
  if (override === 'Busy') return 'Busy';
  if (lastIdleSeconds >= 180) return 'Away';
  return 'Online';
}

function offlineSnapshot(userId: string): PresenceResponse {
  return {
    userId: userId as UserId,
    effectiveStatus: 'Offline',
    manualOverride: null,
    overrideUntilUtc: null,
    lastSeenUtc: null,
  };
}

/**
 * Stateful MSW handlers for the Presence module. Heartbeats, manual
 * overrides and clears mutate the in-memory record so subsequent GETs
 * reflect the change.
 */
export function createPresenceHandlers(baseUrl = DEFAULT_BASE_PATH) {
  let my: Mutable<PresenceResponse> = { ...mockMyPresence };
  let lastIdleSeconds = 0;
  const others: Record<string, PresenceResponse> = { ...mockOtherPresences };

  return [
    http.get(`${baseUrl}/presence/my`, () => HttpResponse.json(my)),

    http.put<never, SetPresenceRequest>(`${baseUrl}/presence/my`, async ({ request }) => {
      const body = (await request.json()) as SetPresenceRequest;
      // Server-side validation parity.
      if (body.manualStatus === 'Available' && body.untilUtc !== null) {
        return HttpResponse.json(
          {
            type: 'about:blank',
            title: 'Bad Request',
            status: 400,
            errors: {
              untilUtc: ['Validation:PresenceUntilWithoutOverride'],
            },
          },
          { status: 400 }
        );
      }
      const override: ManualPresenceStatus | null =
        body.manualStatus === 'Available' ? null : body.manualStatus;
      my = {
        ...my,
        manualOverride: override,
        overrideUntilUtc: override ? body.untilUtc : null,
        effectiveStatus: recomputeEffective(override, lastIdleSeconds),
        lastSeenUtc: toISODateString(new Date().toISOString()),
      };
      return HttpResponse.json(my);
    }),

    http.delete(`${baseUrl}/presence/my/override`, () => {
      my = {
        ...my,
        manualOverride: null,
        overrideUntilUtc: null,
        effectiveStatus: recomputeEffective(null, lastIdleSeconds),
        lastSeenUtc: toISODateString(new Date().toISOString()),
      };
      return HttpResponse.json(my);
    }),

    http.post<never, HeartbeatRequest>(`${baseUrl}/presence/my/poll`, async ({ request }) => {
      const body = (await request.json()) as HeartbeatRequest;
      lastIdleSeconds = Math.min(Math.max(0, body.idleSeconds | 0), 180);
      my = {
        ...my,
        lastSeenUtc: toISODateString(new Date().toISOString()),
        effectiveStatus: recomputeEffective(my.manualOverride, lastIdleSeconds),
      };
      return HttpResponse.json(my);
    }),

    http.get(`${baseUrl}/presence/users/:userId`, ({ params }) => {
      const userId = decodeURIComponent(String(params.userId));
      const snapshot = userId === my.userId ? my : (others[userId] ?? offlineSnapshot(userId));
      return HttpResponse.json(snapshot);
    }),

    http.post<never, BatchPresenceRequest>(
      `${baseUrl}/presence/users/batch`,
      async ({ request }) => {
        const body = (await request.json()) as BatchPresenceRequest;
        if (!body.userIds?.length) {
          return HttpResponse.json(
            { title: 'Bad Request', status: 400, errors: { userIds: ['Required'] } },
            { status: 400 }
          );
        }
        if (body.userIds.length > 200) {
          return HttpResponse.json(
            {
              title: 'Bad Request',
              status: 400,
              errors: { userIds: ['Validation:PresenceBatchTooLarge'] },
            },
            { status: 400 }
          );
        }
        if (new Set(body.userIds).size !== body.userIds.length) {
          return HttpResponse.json(
            {
              title: 'Bad Request',
              status: 400,
              errors: { userIds: ['Validation:PresenceBatchDuplicates'] },
            },
            { status: 400 }
          );
        }
        const presences: Record<string, PresenceResponse> = {};
        for (const id of body.userIds) {
          presences[id] = id === my.userId ? my : (others[id] ?? offlineSnapshot(id));
        }
        const response: BatchPresenceResponse = { presences };
        return HttpResponse.json(response);
      }
    ),
  ];
}
