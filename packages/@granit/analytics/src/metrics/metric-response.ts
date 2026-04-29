/**
 * Public contract for `Granit.Analytics` metric evaluation responses.
 *
 * Mirrors the v1 backend response envelope. Hand-curated rather than imported
 * from Orval — packages downstream of `@granit/analytics` consume these types
 * directly without depending on a generated client.
 */

/**
 * Mirrors `Granit.Analytics.MetricValueKind`. PascalCase wire values — the
 * framework's host registers a `JsonStringEnumConverter()` with no naming
 * policy, so enum names land verbatim. Order matches the backend enum
 * declaration so a numeric drift surfaces in code review.
 */
export type ValueKind = 'Count' | 'Number' | 'Currency' | 'Percentage' | 'Duration' | 'Date';

/**
 * Direction of the previous-period delta. Backend ships this as a plain
 * `string` (not an enum) on `MetricPreviousPayload.Trend`, with the
 * documented values `"up"`, `"down"`, `"flat"` — lowercase, no
 * `JsonStringEnumConverter` involvement. Stays lowercase here.
 */
export type Trend = 'up' | 'down' | 'flat';

// `RefreshHint` is shared between metric responses (this module) and the
// dashboard widget envelope (`@granit/dashboards/rendering`). It lives in
// `@granit/dashboards` to mirror the backend's `Granit.Analytics.Abstractions`
// promotion (ADR-039) and keep the dependency arrow analytics → dashboards
// clean. Re-exported here for source-level back-compat.
import type { RefreshHint } from '@granit/dashboards';
export type { RefreshHint };

/**
 * Calendar-aware period token. Backend (`Granit.Analytics.Metrics.PeriodSpec`)
 * supports more (`last_60s`, `last_5m`, `mtd`, `qtd`, `ytd`, ...); the frontend
 * type stays open as `string` so new tokens land without requiring a client
 * type bump.
 */
export type PeriodToken =
  | 'today'
  | 'yesterday'
  | 'last_60s'
  | 'last_5m'
  | 'last_7d'
  | 'last_30d'
  | 'mtd'
  | 'qtd'
  | 'ytd'
  | (string & {});

export type CompareToken = 'previous_period' | (string & {});

export type PeriodSpec =
  | { readonly token: PeriodToken }
  | { readonly from: string; readonly to: string };

export type CompareSpec = { readonly token: CompareToken };

export interface MetricRequest {
  readonly period: PeriodSpec;
  readonly compareTo?: CompareSpec;
}

export interface MetricPreviousPayload {
  readonly value: number | null;
  /** Ratio (current − previous) / |previous|. Null when previous is 0 or current is null. */
  readonly deltaRatio: number | null;
  readonly trend: Trend;
  /** Drives green/red. Null when delta is undefined. */
  readonly isFavorable: boolean | null;
}

export interface MetricSnapshotPayload {
  readonly value: number | null;
  readonly valueKind: ValueKind;
  /** ISO 4217 currency code when `valueKind === 'Currency'`. Null otherwise. */
  readonly currency: string | null;
  readonly isHigherBetter: boolean;
  readonly noData: boolean;
  readonly previous: MetricPreviousPayload | null;
}

export interface MetricResponse {
  readonly name: string;
  readonly snapshot: MetricSnapshotPayload;
  /** Monotonic counter — future-proofs streaming transport (P2.4). */
  readonly sequence: number;
  /** ISO 8601 UTC timestamp the backend emitted the snapshot. */
  readonly emittedAt: string;
  readonly refreshHint: RefreshHint;
}
