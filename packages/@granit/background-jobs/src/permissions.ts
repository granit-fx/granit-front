/** Permission constants for the background-jobs module. Mirrors `Granit.BackgroundJobs.Endpoints.Permissions.BackgroundJobsPermissions`. */
export const BackgroundJobsPermissions = {
  /** Permissions for the background jobs resource. */
  Jobs: {
    /** Grants read-only access to list and view background jobs. */
    Read: 'BackgroundJobs.Jobs.Read',
    /** Grants full management access to all background jobs endpoints (list, detail, pause, resume, trigger). */
    Manage: 'BackgroundJobs.Jobs.Manage',
  },
} as const;
