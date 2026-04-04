import type { CorrelationId, EntityId, ISODateString } from '@granit/types';

/** Status of a scheduled action. Mirrors Granit.Scheduling.ScheduledActionStatus .NET enum. */
export const ScheduledActionStatus = {
  Pending: 0,
  Executed: 1,
  Cancelled: 2,
  Failed: 3,
  Processing: 4,
} as const;

export type ScheduledActionStatus =
  (typeof ScheduledActionStatus)[keyof typeof ScheduledActionStatus];

/** Branded scheduled action identifier. */
export type ScheduledActionId = EntityId<'ScheduledAction'>;

/** Response DTO for a scheduled action. Mirrors Granit.Scheduling.ScheduledActionResponse .NET. */
export interface ScheduledActionResponse {
  readonly id: ScheduledActionId;
  readonly payloadType: string;
  readonly executeAt: ISODateString;
  readonly correlationId: CorrelationId | null;
  readonly status: ScheduledActionStatus;
  readonly executedAt: ISODateString | null;
  readonly cancelledBy: string | null;
  readonly failureReason: string | null;
  readonly createdAt: ISODateString;
}

/** Request body for rescheduling a pending action. */
export interface RescheduleActionRequest {
  readonly newExecuteAt: ISODateString;
}
