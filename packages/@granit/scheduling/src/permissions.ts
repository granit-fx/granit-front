/** Permission constants for the scheduling module. Mirrors `Granit.Scheduling.Endpoints.Permissions.SchedulingPermissions`. */
export const SchedulingPermissions = {
  /** Permissions for the scheduled actions resource. */
  Actions: {
    /** Grants read-only access to list and view scheduled actions. */
    Read: 'Scheduling.Actions.Read',
    /** Grants management access (cancel, reschedule) to scheduled actions. */
    Manage: 'Scheduling.Actions.Manage',
  },
} as const;
