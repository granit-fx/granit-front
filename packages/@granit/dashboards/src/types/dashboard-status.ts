/**
 * Lifecycle state of a persisted `Dashboard` aggregate. Mirrors
 * `Granit.Dashboards.Domain.DashboardStatus`. PascalCase wire values per
 * ADR-039 §6.1.
 *
 * Transitions are strict and one-way except `Archived → Draft` (admin
 * restore action via `POST /dashboards/{id}/restore`).
 */
export type DashboardStatus =
  /** Default state on creation. Visible only to its CreatedBy editor. */
  | 'Draft'
  /** Surfaced in the catalog, served to all users with the relevant permissions. */
  | 'Published'
  /** Hidden but kept for audit. Restorable to Draft. */
  | 'Archived';
