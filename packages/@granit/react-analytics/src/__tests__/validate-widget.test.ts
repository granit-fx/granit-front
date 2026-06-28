import { Datasource } from '@granit/dashboards';
import { describe, expect, it } from 'vitest';

import { isWidgetConfigComplete, validateWidgetConfig } from '../editor/validate-widget';

import type {
  ChartWidgetDefinition,
  KpiWidgetDefinition,
  MapWidgetDefinition,
  PivotWidgetDefinition,
  TableWidgetDefinition,
} from '@granit/analytics';

const base = { slug: 'W', position: 0, size: { width: 6, height: 3 } } as const;

const chart = (over: Partial<ChartWidgetDefinition> = {}): ChartWidgetDefinition => ({
  ...base,
  type: 'chart',
  queryName: 'Q',
  groupBy: 'Status',
  aggregation: 'Sum',
  field: 'Amount',
  chartType: 'Bar',
  ...over,
});

const map = (over: Partial<MapWidgetDefinition> = {}): MapWidgetDefinition => ({
  ...base,
  type: 'map',
  queryName: 'Q',
  pointSource: { kind: 'lat-lng', latitudeColumn: 'Lat', longitudeColumn: 'Lng' },
  popupColumns: null,
  defaultZoom: 5,
  defaultCenter: null,
  clusterThreshold: 200,
  detailRoute: null,
  defaultLayerKind: null,
  tileUrlTemplate: null,
  ...over,
});

const fields = (widget: Parameters<typeof validateWidgetConfig>[0]): string[] =>
  validateWidgetConfig(widget).map((error) => error.field);

describe('validateWidgetConfig', () => {
  it('passes a fully-bound chart', () => {
    expect(isWidgetConfigComplete(chart())).toBe(true);
  });

  it('flags an empty chart queryName / groupBy', () => {
    expect(fields(chart({ queryName: '', groupBy: '  ' }))).toEqual(['queryName', 'groupBy']);
  });

  it('requires the chart field unless the aggregation is Count', () => {
    expect(fields(chart({ field: null }))).toEqual(['field']);
    expect(fields(chart({ aggregation: 'Count', field: null }))).toEqual([]);
  });

  it('requires the table queryName', () => {
    const table: TableWidgetDefinition = {
      ...base,
      type: 'table',
      queryName: '',
      visibleColumns: null,
      pageSize: 25,
    };
    expect(fields(table)).toEqual(['queryName']);
  });

  it('requires pivot rowFields and the value field unless Count', () => {
    const pivot: PivotWidgetDefinition = {
      ...base,
      type: 'pivot',
      queryName: 'Q',
      rowFields: [],
      columnFields: [],
      valueField: null,
      valueAggregation: 'Sum',
    };
    expect(fields(pivot)).toEqual(['rowFields', 'valueField']);
    expect(fields({ ...pivot, rowFields: ['Region'], valueAggregation: 'Count' })).toEqual([]);
  });

  it('requires the kpi name for the active datasource kind', () => {
    const metric: KpiWidgetDefinition = {
      ...base,
      type: 'kpi',
      datasource: Datasource.metric(''),
    };
    expect(fields(metric)).toEqual(['metricName']);
    const query = { ...metric, datasource: Datasource.queryAggregate('', 'Sum') };
    expect(fields(query)).toEqual(['queryName']);
  });

  it('requires both lat/lng columns, or the geography column', () => {
    expect(
      fields(map({ pointSource: { kind: 'lat-lng', latitudeColumn: '', longitudeColumn: '' } }))
    ).toEqual(['latitudeColumn', 'longitudeColumn']);
    expect(fields(map({ pointSource: { kind: 'geography', geographyColumn: '' } }))).toEqual([
      'geographyColumn',
    ]);
    expect(fields(map({ pointSource: { kind: 'geography', geographyColumn: 'Geom' } }))).toEqual(
      []
    );
  });

  it('requires locality + country for an address source; street + postal code are optional', () => {
    expect(
      fields(
        map({
          pointSource: {
            kind: 'address',
            streetColumn: '',
            postalCodeColumn: '',
            localityColumn: '',
            countryColumn: '',
          },
        })
      )
    ).toEqual(['localityColumn', 'countryColumn']);
    // Street + postal code empty is fine once locality + country are set.
    expect(
      fields(
        map({
          pointSource: {
            kind: 'address',
            streetColumn: '',
            postalCodeColumn: '',
            localityColumn: 'City',
            countryColumn: 'Country',
          },
        })
      )
    ).toEqual([]);
  });
});
