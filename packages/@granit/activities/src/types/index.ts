import type { ISODateString } from '@granit/types';

/**
 * Lifecycle status of an activity. Mirrors `Granit.Activities.Domain.ActivityStatus`
 * (string-serialized verbatim). Three terminal states only — `Overdue` is a
 * computed view (`Open` + past due), never a persisted status value; see
 * {@link ActivityCalendarColor} for the derived calendar bucket.
 */
export type ActivityStatus = 'Open' | 'Done' | 'Cancelled';

/**
 * Status filter accepted by the list / calendar endpoints. Mirrors
 * `Granit.Activities.Persistence.ActivityStatusFilter`. Omit the filter
 * entirely to match every status — there is no `All` wire value.
 */
export type ActivityStatusFilter = 'OpenOrOverdue' | 'Done' | 'Cancelled';

export type ActivityCalendarColor = 'open' | 'overdue' | 'done' | 'cancelled';

export interface ActivityResponse {
  readonly id: string;
  readonly entityType: string;
  readonly entityId: string;
  readonly type: string;
  readonly assignedToUserId: string;
  readonly createdByUserId: string | null;
  readonly dueAt: ISODateString;
  readonly description: string | null;
  readonly status: ActivityStatus;
  readonly completedAt: ISODateString | null;
  readonly completedByUserId: string | null;
  readonly createdAt: ISODateString;
}

export interface ActivityListResponse {
  readonly items: readonly ActivityResponse[];
  readonly totalCount: number;
  readonly page: number;
  readonly pageSize: number;
}

export interface ActivityListFilter {
  readonly status?: ActivityStatusFilter;
  readonly assignedToUserId?: string;
  readonly entityType?: string;
  readonly entityId?: string;
  /** Inclusive lower bound on `dueAt` (ISO 8601). */
  readonly dueAtFrom?: string;
  /** Exclusive upper bound on `dueAt` (ISO 8601, half-open window). */
  readonly dueAtTo?: string;
  readonly page?: number;
  readonly pageSize?: number;
}

export interface CreateActivityRequest {
  readonly entityType: string;
  readonly entityId: string;
  readonly type: string;
  readonly assignedToUserId: string;
  readonly dueAt: ISODateString;
  readonly description?: string | null;
}

/**
 * Body for `POST /{id}/complete` — empty. The completion timestamp and the
 * actor are resolved server-side (`IClock` + `ClaimsPrincipal`) for audit
 * integrity; clients cannot supply them.
 */
export type CompleteActivityRequest = Record<string, never>;

/**
 * Body for `POST /{id}/cancel` — empty. The cancellation timestamp and the
 * actor are resolved server-side for audit integrity.
 */
export type CancelActivityRequest = Record<string, never>;

export interface ReassignActivityRequest {
  readonly newAssigneeUserId: string;
}

export interface RescheduleActivityRequest {
  readonly newDueAt: ISODateString;
}

export interface ActivityCalendarItemResponse {
  readonly id: string;
  readonly start: ISODateString;
  readonly end: ISODateString | null;
  readonly title: string;
  readonly color: ActivityCalendarColor;
  readonly type: string;
  readonly status: ActivityStatus;
  readonly entityType: string;
  readonly entityId: string;
  readonly assignedToUserId: string;
}

export interface ActivityCalendarFilter {
  readonly from: ISODateString;
  readonly to: ISODateString;
  /** Either the literal `'me'` or a user GUID. */
  readonly assignee?: string;
  readonly entityType?: string;
  readonly type?: string;
  readonly status?: ActivityStatusFilter;
}
