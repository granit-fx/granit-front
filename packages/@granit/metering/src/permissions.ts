export const MeteringPermissions = {
  Meters: {
    Read: 'Metering.Meters.Read',
    Manage: 'Metering.Meters.Manage',
  },
  Usage: {
    Read: 'Metering.Usage.Read',
    Record: 'Metering.Usage.Record',
  },
  Events: {
    /** Soft-deprecate individual meter events (admin-only — billing tampering). */
    Manage: 'Metering.Events.Manage',
    /** Backfill historical events beyond the 7-day ingestion window (admin-only). */
    Backfill: 'Metering.Events.Backfill',
  },
} as const;
