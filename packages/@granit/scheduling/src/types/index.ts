import type { CorrelationId, EntityId, ISODateString } from '@granit/types';

/**
 * Status of a scheduled action. Mirrors Granit.Scheduling.ScheduledActionStatus .NET enum.
 * Serialized as PascalCase strings via the framework's global `JsonStringEnumConverter`.
 */
export type ScheduledActionStatus = 'Pending' | 'Executed' | 'Cancelled' | 'Failed' | 'Processing';

export const ScheduledActionStatus = {
  Pending: 'Pending',
  Executed: 'Executed',
  Cancelled: 'Cancelled',
  Failed: 'Failed',
  Processing: 'Processing',
} as const satisfies Record<string, ScheduledActionStatus>;

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
  readonly attemptCount: number;
  readonly createdAt: ISODateString;
  readonly modifiedAt: ISODateString | null;
}

/** Request body for rescheduling a pending action. */
export interface RescheduleActionRequest {
  readonly newExecuteAt: ISODateString;
}
