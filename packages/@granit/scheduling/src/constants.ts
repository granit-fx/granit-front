/** Permission strings for the Scheduling module. */
export const SCHEDULING_PERMISSIONS = {
  ACTIONS_READ: 'Scheduling.Actions.Read',
  ACTIONS_MANAGE: 'Scheduling.Actions.Manage',
} as const;

/** Status → badge color mapping for UI rendering. */
export const SCHEDULING_STATUS_COLORS = {
  0: 'blue',
  1: 'green',
  2: 'gray',
  3: 'red',
  4: 'amber',
} as const;

/** Status → human-readable label mapping. */
export const SCHEDULING_STATUS_LABELS = {
  0: 'Pending',
  1: 'Executed',
  2: 'Cancelled',
  3: 'Failed',
  4: 'Processing',
} as const;
