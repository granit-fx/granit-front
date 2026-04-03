/** Status of a scheduled action. Mirrors Granit.Scheduling.ScheduledActionStatus .NET enum. */
export enum ScheduledActionStatus {
  Pending = 0,
  Executed = 1,
  Cancelled = 2,
  Failed = 3,
  Processing = 4,
}

/** Response DTO for a scheduled action. Mirrors Granit.Scheduling.ScheduledActionResponse .NET. */
export interface ScheduledActionResponse {
  readonly id: string;
  readonly payloadType: string;
  readonly executeAt: string;
  readonly correlationId: string | null;
  readonly status: ScheduledActionStatus;
  readonly executedAt: string | null;
  readonly cancelledBy: string | null;
  readonly failureReason: string | null;
  readonly createdAt: string;
}

/** Request body for rescheduling a pending action. */
export interface RescheduleActionRequest {
  readonly newExecuteAt: string;
}
