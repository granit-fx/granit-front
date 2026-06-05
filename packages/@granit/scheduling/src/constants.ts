import type { ScheduledActionStatus } from './types/index';

/** Status → badge color mapping for UI rendering. */
export const SCHEDULING_STATUS_COLORS = {
  Pending: 'blue',
  Executed: 'green',
  Cancelled: 'gray',
  Failed: 'red',
  Processing: 'amber',
} as const satisfies Record<ScheduledActionStatus, string>;

/** Status → human-readable label mapping. */
export const SCHEDULING_STATUS_LABELS = {
  Pending: 'Pending',
  Executed: 'Executed',
  Cancelled: 'Cancelled',
  Failed: 'Failed',
  Processing: 'Processing',
} as const satisfies Record<ScheduledActionStatus, string>;
