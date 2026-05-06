export type ActivityStatus = 'Open' | 'Completed' | 'Cancelled' | 'Overdue';

export type ActivityStatusFilter = ActivityStatus | 'All' | 'OpenOrOverdue';

export type ActivityCalendarColor = 'open' | 'overdue' | 'done' | 'cancelled';

export interface ActivityResponse {
  readonly id: string;
  readonly entityType: string;
  readonly entityId: string;
  readonly type: string;
  readonly assignedToUserId: string;
  readonly createdByUserId: string | null;
  readonly dueAt: string;
  readonly description: string | null;
  readonly status: ActivityStatus;
  readonly completedAt: string | null;
  readonly completedByUserId: string | null;
  readonly createdAt: string;
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
  readonly type?: string;
  readonly page?: number;
  readonly pageSize?: number;
}

export interface CreateActivityRequest {
  readonly entityType: string;
  readonly entityId: string;
  readonly type: string;
  readonly assignedToUserId: string;
  readonly dueAt: string;
  readonly description: string | null;
}

export interface CompleteActivityRequest {
  readonly completedAt: string;
}

export interface CancelActivityRequest {
  readonly cancelledAt: string;
}

export interface ReassignActivityRequest {
  readonly newAssigneeUserId: string;
}

export interface RescheduleActivityRequest {
  readonly newDueAt: string;
}

export interface ActivityCalendarItemResponse {
  readonly id: string;
  readonly start: string;
  readonly end: string | null;
  readonly title: string;
  readonly color: ActivityCalendarColor;
  readonly type: string;
  readonly status: ActivityStatus;
  readonly entityType: string;
  readonly entityId: string;
  readonly assignedToUserId: string;
}

export interface ActivityCalendarFilter {
  readonly from: string;
  readonly to: string;
  /** Either the literal `'me'` or a user GUID. */
  readonly assignee?: string;
  readonly entityType?: string;
  readonly type?: string;
  readonly status?: ActivityStatusFilter;
}
