import type { AggregateFunction } from './aggregate-function';
import type { DataKeyFormat } from './data-key-format';

/**
 * Aggregation kinds for live telemetry streams. Mirrors
 * `Granit.Dashboards.TelemetryAggregation` (P2.2). PascalCase wire values —
 * the backend registers a `JsonStringEnumConverter` without a naming policy.
 */
export type TelemetryAggregation = 'Last' | 'Avg' | 'Sum' | 'Min' | 'Max' | 'Count';

/**
 * Bound to a registered metric definition by name. The metric's own
 * aggregation, base filter and period selector apply — no extra knobs.
 * Mirrors `Granit.Dashboards.MetricDatasource`.
 */
export interface MetricDatasource {
  readonly kind: 'metric';
  /** Wire identifier of the metric (e.g. `Granit.Invoicing.UnpaidInvoiceCountMetric`). */
  readonly metricName: string;
}

/**
 * Bound to a registered query definition by name; applies an aggregation over
 * a chosen field (`field === null` ⇒ {@link AggregateFunction} `'Count'`).
 * Mirrors `Granit.Dashboards.QueryAggregateDatasource`.
 */
export interface QueryAggregateDatasource {
  readonly kind: 'query-aggregate';
  /** Wire identifier of the query (e.g. `Granit.Invoicing.InvoiceQuery`). */
  readonly queryName: string;
  readonly aggregation: AggregateFunction;
  /** Field aggregated. `null` when {@link aggregation} is `'Count'`. */
  readonly field: string | null;
  /**
   * Per-series presentation hints. When the consuming widget renders multiple
   * series (e.g. a chart with a group-by), each entry's {@link DataKeyFormat.key}
   * matches a series identifier. `null` = active theme palette.
   */
  readonly keyFormats: readonly DataKeyFormat[] | null;
}

/**
 * Bound to live telemetry pushed from the runtime (IoT). Resolves the entity
 * at render time via the dashboard's entity-alias bindings (P2.3). Mirrors
 * `Granit.Dashboards.TelemetryDatasource`.
 */
export interface TelemetryDatasource {
  readonly kind: 'iot-telemetry';
  /** Entity alias name — resolves to a device id at render time. */
  readonly entityAlias: string;
  /** Telemetry key (e.g. `temperature`, `pressure`, `rpm`). */
  readonly telemetryKey: string;
  /** Aggregation applied over the dashboard's time window. Defaults to `'Last'`. */
  readonly aggregation: TelemetryAggregation;
  readonly keyFormats: readonly DataKeyFormat[] | null;
}

/**
 * Abstract data binding for a widget — decouples a widget from how its data
 * arrives. Mirrors `Granit.Dashboards.Datasource` (P2.2). Wire format uses the
 * `kind` discriminator with kebab tags (`metric`, `query-aggregate`,
 * `iot-telemetry`) — same approach as `WidgetDefinition.type` (P1.1) and
 * `EntityAliasResolver.kind` (P2.3).
 */
export type Datasource = MetricDatasource | QueryAggregateDatasource | TelemetryDatasource;

export function isMetricDatasource(ds: Datasource): ds is MetricDatasource {
  return ds.kind === 'metric';
}

export function isQueryAggregateDatasource(ds: Datasource): ds is QueryAggregateDatasource {
  return ds.kind === 'query-aggregate';
}

export function isTelemetryDatasource(ds: Datasource): ds is TelemetryDatasource {
  return ds.kind === 'iot-telemetry';
}

/**
 * Compact factories that mirror the backend's
 * `Datasource.Metric(...)` / `Datasource.QueryAggregate(...)` / `Datasource.Telemetry(...)`
 * convenience APIs. Use at definition call sites:
 *
 *     datasource: Datasource.metric('Granit.Invoicing.UnpaidInvoiceCountMetric'),
 */
export const Datasource = {
  metric(metricName: string): MetricDatasource {
    return { kind: 'metric', metricName };
  },
  queryAggregate(
    queryName: string,
    aggregation: AggregateFunction,
    field: string | null = null,
    keyFormats: readonly DataKeyFormat[] | null = null
  ): QueryAggregateDatasource {
    return { kind: 'query-aggregate', queryName, aggregation, field, keyFormats };
  },
  telemetry(
    entityAlias: string,
    telemetryKey: string,
    aggregation: TelemetryAggregation = 'Last',
    keyFormats: readonly DataKeyFormat[] | null = null
  ): TelemetryDatasource {
    return { kind: 'iot-telemetry', entityAlias, telemetryKey, aggregation, keyFormats };
  },
} as const;
