import type { ISODateString } from '@granit/types';

export type { BackgroundJobListParams } from './background-job-list-params';

/** Status of a background job. Mirrors Granit.BackgroundJobs.BackgroundJobStatus .NET. */
export interface BackgroundJobStatus {
  readonly jobName: string;
  readonly cronExpression: string;
  readonly isEnabled: boolean;
  readonly lastExecutedAt: ISODateString | null;
  readonly nextExecutionAt: ISODateString | null;
  readonly consecutiveFailures: number;
  readonly deadLetterCount: number;
  readonly lastError: string | null;
}
