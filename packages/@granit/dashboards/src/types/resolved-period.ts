/**
 * Absolute, half-open `[from, to)` time window — the resolved form of a
 * `PeriodSpec` after named-token expansion against the backend's `IClock`.
 * Mirrors `Granit.Analytics.ResolvedPeriod`. ISO 8601 UTC strings on the
 * wire.
 *
 * Lives in `@granit/dashboards` (alongside the rendering envelope) rather
 * than `@granit/analytics` so the dashboards rendering boundary can carry
 * it without dragging in the analytics surface — mirrors the backend's
 * `Granit.Analytics.Abstractions` placement per ADR-039.
 */
export interface ResolvedPeriod {
  /** Inclusive lower bound (UTC). */
  readonly from: string;
  /** Exclusive upper bound (UTC). */
  readonly to: string;
}
