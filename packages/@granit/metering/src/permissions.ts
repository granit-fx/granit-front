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
    /**
     * Manage individual meter events (currently the soft-deprecation endpoint).
     * Deliberately separated from `Usage.Record` because deprecation is destructive
     * at the billing-data level (ISO 27001 A.9.4 — least privilege).
     */
    Manage: 'Metering.Events.Manage',
    /**
     * Backfill historical events older than the standard 7-day ingestion window
     * (up to 365 days). Triggers automatic recomputes on past `UsageAggregate` rows.
     */
    Backfill: 'Metering.Events.Backfill',
  },
} as const;
