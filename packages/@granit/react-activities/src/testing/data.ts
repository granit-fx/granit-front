import { toISODateString, type ISODateString } from '@granit/types';
// ---------------------------------------------------------------------------
// @granit/react-activities/testing — mock data
// ---------------------------------------------------------------------------

import type { ActivityCalendarItemResponse, ActivityResponse } from '@granit/activities';

const DAY = 24 * 60 * 60 * 1000;
const ADMIN = 'd2c47314-4d08-4952-98b1-a1b8a6e22ef1';
const COLLEAGUE = 'b1e22a44-1234-5678-9abc-def012345678';
const ENTITY_TYPE = 'Granit.Parties.Party';

const now = Date.now();
const iso = (offsetDays: number): ISODateString =>
  toISODateString(new Date(now + offsetDays * DAY).toISOString());

/**
 * Mock activities spanning the three lifecycle states the backend ships
 * (`Open` / `Done` / `Cancelled`). `act-002` is `Open` with a past due date —
 * i.e. overdue by derivation, never a persisted status.
 */
export const mockActivities: readonly ActivityResponse[] = [
  {
    id: 'act-001',
    entityType: ENTITY_TYPE,
    entityId: '11111111-1111-1111-1111-111111111111',
    type: 'FollowUp',
    assignedToUserId: ADMIN,
    createdByUserId: ADMIN,
    dueAt: iso(1),
    description: 'Confirm renewal terms with the customer',
    status: 'Open',
    completedAt: null,
    completedByUserId: null,
    createdAt: iso(-3),
  },
  {
    id: 'act-002',
    entityType: ENTITY_TYPE,
    entityId: '22222222-2222-2222-2222-222222222222',
    type: 'Reminder',
    assignedToUserId: ADMIN,
    createdByUserId: ADMIN,
    dueAt: iso(-1),
    description: 'Quarterly review prep',
    status: 'Open',
    completedAt: null,
    completedByUserId: null,
    createdAt: iso(-5),
  },
  {
    id: 'act-003',
    entityType: ENTITY_TYPE,
    entityId: '33333333-3333-3333-3333-333333333333',
    type: 'CallBack',
    assignedToUserId: COLLEAGUE,
    createdByUserId: ADMIN,
    dueAt: iso(2),
    description: 'Follow up on the declined card',
    status: 'Open',
    completedAt: null,
    completedByUserId: null,
    createdAt: iso(-2),
  },
  {
    id: 'act-004',
    entityType: ENTITY_TYPE,
    entityId: '44444444-4444-4444-4444-444444444444',
    type: 'Meeting',
    assignedToUserId: COLLEAGUE,
    createdByUserId: ADMIN,
    dueAt: iso(-7),
    description: 'Kickoff call',
    status: 'Done',
    completedAt: iso(-6),
    completedByUserId: COLLEAGUE,
    createdAt: iso(-9),
  },
  {
    id: 'act-005',
    entityType: ENTITY_TYPE,
    entityId: '55555555-5555-5555-5555-555555555555',
    type: 'Reminder',
    assignedToUserId: ADMIN,
    createdByUserId: ADMIN,
    dueAt: iso(7),
    description: 'Send onboarding paperwork',
    status: 'Cancelled',
    completedAt: null,
    completedByUserId: null,
    createdAt: iso(-1),
  },
];

/**
 * Calendar projection mirroring `GET /calendar`. `color` is the server-derived
 * bucket: `done` / `cancelled` from the status, `overdue` when an `Open`
 * activity is past due, otherwise `open`.
 */
export const mockActivityCalendarItems: readonly ActivityCalendarItemResponse[] =
  mockActivities.map((a) => ({
    id: a.id,
    start: a.dueAt,
    end: null,
    title: a.description ?? a.type,
    color:
      a.status === 'Done'
        ? 'done'
        : a.status === 'Cancelled'
          ? 'cancelled'
          : new Date(a.dueAt).getTime() < now
            ? 'overdue'
            : 'open',
    type: a.type,
    status: a.status,
    entityType: a.entityType,
    entityId: a.entityId,
    assignedToUserId: a.assignedToUserId,
  }));
