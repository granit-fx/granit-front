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
export type { RefreshHint } from '@granit/dashboards';
import type { AggregateFunction, RefreshHint } from '@granit/dashboards';
import type { ISODateString } from '@granit/types';

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
  { readonly token: PeriodToken } | { readonly from: ISODateString; readonly to: ISODateString };

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
  readonly emittedAt: ISODateString;
  readonly refreshHint: RefreshHint;
}

/**
 * One entry in the metric catalogue (`GET {basePath}/metrics/catalog`). Mirrors
 * the wire-relevant subset of the backend's `IMetricDefinitionDescriptor` so a
 * KPI widget editor can offer a dropdown of registered metrics instead of a
 * free-text metric name.
 *
 * Unlike the query catalogue's `labelKey`, `label` is resolved server-side from
 * the metric's localization resource (key `"Metric:{name}"`) in the request
 * culture, degrading to `name` when the module has not declared that key — so
 * the editor renders it verbatim, no client-side i18n lookup.
 */
export interface MetricCatalogEntryResponse {
  /** Wire identifier — invoke directly via `POST {basePath}/metrics/{name}`. */
  readonly name: string;
  /** Server-resolved display label (degrades to {@link name}). */
  readonly label: string;
  /** Semantic value kind — drives the editor's preview formatting. */
  readonly valueKind: ValueKind;
  /** Aggregation function applied by the metric. */
  readonly aggregation: AggregateFunction;
  /** Whether higher values are favorable — drives the delta arrow color. */
  readonly isHigherBetter: boolean;
  /** Expected freshness — informs the editor's refresh-cadence hint. */
  readonly refreshHint: RefreshHint;
  /** ISO 4217 currency code when `valueKind === 'Currency'`, else `null`. */
  readonly currencyCode: string | null;
}
