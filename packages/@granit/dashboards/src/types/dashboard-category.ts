/**
 * Coarse classification shipped on every {@link DashboardDefinition}.
 * Drives the catalogue ordering surfaced by the dashboard registry and the
 * section grouping in the admin import dialog.
 *
 * Mirrors `Granit.Dashboards.DashboardCategory`. PascalCase wire values — the
 * framework's host registers a `JsonStringEnumConverter()` with no naming
 * policy, so enum names land verbatim. Order matches the backend numeric
 * declaration (`General = 0`, `Finance = 1`, …, `Iot = 6`).
 */
export type DashboardCategory =
  /** Default — uncategorised. Use only when the others genuinely do not fit. */
  | 'General'
  /** Invoicing, payments, subscriptions, customer balance, tax. */
  | 'Finance'
  /** AI usage, blob storage, background jobs, webhooks, observability. */
  | 'Operations'
  /** Identity, authorization, auditing. */
  | 'Security'
  /** Privacy / GDPR (export requests, erasure, retention). */
  | 'Compliance'
  /** Multi-tenancy, platform-level admin (tenant lifecycle, feature flags). */
  | 'Platform'
  /** IoT / real-time telemetry — sensors, alarms, video feeds. */
  | 'Iot';
