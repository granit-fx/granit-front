import { describe, expect, it } from 'vitest';

import {
  Datasource,
  isMetricDatasource,
  isQueryAggregateDatasource,
  isTelemetryDatasource,
} from '../types/datasource.js';

import type {
  MetricDatasource,
  QueryAggregateDatasource,
  TelemetryDatasource,
} from '../types/datasource.js';

// Pinned wire-format fixtures. Each fixture is the literal JSON shape the
// backend (`Granit.Dashboards.Abstractions.Tests/DatasourceTests`) round-trips
// — kept verbatim so a casing or discriminator drift fails CI here before it
// reaches the wire.
const METRIC_FIXTURE = {
  kind: 'metric',
  metricName: 'Granit.Invoicing.UnpaidInvoiceCountMetric',
} as const;

const QUERY_AGGREGATE_FIXTURE = {
  kind: 'query-aggregate',
  queryName: 'Granit.Invoicing.InvoiceQuery',
  aggregation: 'Sum',
  field: 'Total',
  keyFormats: null,
} as const;

const TELEMETRY_FIXTURE = {
  kind: 'iot-telemetry',
  entityAlias: 'currentDevice',
  telemetryKey: 'temperature',
  aggregation: 'Last',
  keyFormats: null,
} as const;

describe('Datasource — wire format', () => {
  it('accepts the metric kind verbatim', () => {
    const ds: MetricDatasource = METRIC_FIXTURE;
    expect(isMetricDatasource(ds)).toBe(true);
    expect(ds.metricName).toBe('Granit.Invoicing.UnpaidInvoiceCountMetric');
  });

  it('accepts the query-aggregate kind verbatim', () => {
    const ds: QueryAggregateDatasource = QUERY_AGGREGATE_FIXTURE;
    expect(isQueryAggregateDatasource(ds)).toBe(true);
    expect(ds.aggregation).toBe('Sum');
  });

  it('accepts the iot-telemetry kind verbatim', () => {
    const ds: TelemetryDatasource = TELEMETRY_FIXTURE;
    expect(isTelemetryDatasource(ds)).toBe(true);
    expect(ds.aggregation).toBe('Last');
  });

  it('round-trips through JSON without mutation', () => {
    for (const fixture of [METRIC_FIXTURE, QUERY_AGGREGATE_FIXTURE, TELEMETRY_FIXTURE]) {
      expect(JSON.parse(JSON.stringify(fixture))).toEqual(fixture);
    }
  });
});

describe('Datasource — factories', () => {
  it('Datasource.metric mirrors the kebab discriminator', () => {
    expect(Datasource.metric('M1')).toEqual({ kind: 'metric', metricName: 'M1' });
  });

  it('Datasource.queryAggregate defaults field and keyFormats to null', () => {
    expect(Datasource.queryAggregate('Q1', 'Count')).toEqual({
      kind: 'query-aggregate',
      queryName: 'Q1',
      aggregation: 'Count',
      field: null,
      keyFormats: null,
    });
  });

  it('Datasource.telemetry defaults aggregation to Last (the most-recent reading)', () => {
    expect(Datasource.telemetry('alias', 'temperature')).toEqual({
      kind: 'iot-telemetry',
      entityAlias: 'alias',
      telemetryKey: 'temperature',
      aggregation: 'Last',
      keyFormats: null,
    });
  });

  it('Datasource.telemetry passes through keyFormats and aggregation overrides', () => {
    const ds = Datasource.telemetry('alias', 'rpm', 'Avg', [
      { key: 'rpm', labelLocalizationKey: null, color: '#0a84ff', unit: null, decimals: 0 },
    ]);
    expect(ds.aggregation).toBe('Avg');
    expect(ds.keyFormats).toHaveLength(1);
    expect(ds.keyFormats?.[0]?.color).toBe('#0a84ff');
  });
});
