/**
 * Coarse classification shipped on every {@link DashboardDefinition}.
 * Drives the catalogue ordering surfaced by the dashboard registry and the
 * section grouping in the admin import dialog.
 *
 * Mirrors `Granit.Dashboards.DashboardCategory` (numeric enum). Backend ships
 * via `JsonStringEnumConverter` so the wire is the lowercase form here.
 */
export type DashboardCategory =
  /** Default — uncategorised. Use only when the others genuinely do not fit. */
  | 'general'
  /** Invoicing, payments, subscriptions, customer balance, tax. */
  | 'finance'
  /** AI usage, blob storage, background jobs, webhooks, observability. */
  | 'operations'
  /** Identity, authorization, auditing. */
  | 'security'
  /** Privacy / GDPR (export requests, erasure, retention). */
  | 'compliance'
  /** Multi-tenancy, platform-level admin (tenant lifecycle, feature flags). */
  | 'platform'
  /** IoT / real-time telemetry — sensors, alarms, video feeds. */
  | 'iot';
