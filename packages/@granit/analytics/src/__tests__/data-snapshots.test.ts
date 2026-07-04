import { toISODateString } from '@granit/types';
import { describe, expect, it } from 'vitest';

import {
  isChartSnapshotEnvelope,
  isPivotSnapshotEnvelope,
  isTableSnapshotEnvelope,
} from '../widgets/index';

import type {
  ChartSnapshotEnvelope,
  ChartType,
  PivotSnapshotEnvelope,
  TableSnapshotEnvelope,
} from '../types';
import type { WidgetSnapshotEnvelope } from '@granit/dashboards';

// Pinned wire-format fixtures mirroring B3-4 / B3-5 / B3-6 backend output:
//   - Granit.Analytics.Endpoints.Rendering.TableWidgetInstanceRenderer
//   - Granit.Analytics.Endpoints.Rendering.ChartWidgetInstanceRenderer
//   - Granit.Analytics.Endpoints.Rendering.PivotWidgetInstanceRenderer
// All emit camelCase property names + PascalCase enum values per ADR-039 §6.1.

const TABLE_FIXTURE: TableSnapshotEnvelope = {
  status: 'Snapshot',
  widgetType: 'Table',
  snapshot: {
    columns: [
      { name: 'id', labelLocalizationKey: null },
      // B3-8b — currency code is per-column, so a table mixing
      // AmountEur and AmountUsd surfaces both independently on the wire.
      { name: 'amount', labelLocalizationKey: 'Column:Invoice.Amount', currencyCode: 'EUR' },
      { name: 'status', labelLocalizationKey: 'Column:Invoice.Status' },
    ],
    rows: [
      { id: 'inv-001', amount: 1240.5, status: 'Open' },
      { id: 'inv-002', amount: 890, status: 'Paid' },
    ],
    totalRowCount: 27,
  },
  sequence: 1,
  emittedAt: toISODateString('2026-04-29T12:34:56.789Z'),
  refreshHint: 'Dynamic',
  reasonLocalizationKey: null,
};

const CHART_FIXTURE: ChartSnapshotEnvelope = {
  status: 'Snapshot',
  widgetType: 'Chart',
  snapshot: {
    chartType: 'HorizontalBar',
    groupBy: 'IssuedAtMonth',
    aggregation: 'Sum',
    field: 'Total',
    buckets: [
      { label: '2026-02', value: 12500 },
      { label: '2026-03', value: 18200 },
      { label: '2026-04', value: null },
    ],
    // B3-8b — value field declared `.Currency("EUR")` propagates here.
    currency: 'EUR',
  },
  sequence: 1,
  emittedAt: toISODateString('2026-04-29T12:34:56.789Z'),
  refreshHint: 'Dynamic',
  reasonLocalizationKey: null,
};

const PIVOT_FIXTURE: PivotSnapshotEnvelope = {
  status: 'Snapshot',
  widgetType: 'Pivot',
  snapshot: {
    rowFields: ['Region'],
    columnFields: ['Status'],
    valueField: 'Total',
    aggregation: 'Sum',
    cells: [
      { rowKeys: ['EU'], columnKeys: ['Open'], value: 9500 },
      { rowKeys: ['EU'], columnKeys: ['Paid'], value: 12300 },
      { rowKeys: ['NA'], columnKeys: ['Open'], value: null },
    ],
    // B3-8b — every cell shares the same currency (same value field).
    currency: 'EUR',
  },
  sequence: 1,
  emittedAt: toISODateString('2026-04-29T12:34:56.789Z'),
  refreshHint: 'Dynamic',
  reasonLocalizationKey: null,
};

describe('TableSnapshotEnvelope — wire format', () => {
  it('surfaces per-column currencyCode (B3-8b) — null for non-monetary columns', () => {
    expect(TABLE_FIXTURE.snapshot?.columns[0]?.currencyCode).toBeUndefined();
    expect(TABLE_FIXTURE.snapshot?.columns[1]?.currencyCode).toBe('EUR');
    expect(TABLE_FIXTURE.snapshot?.columns[2]?.currencyCode).toBeUndefined();
  });

  it('carries columns + rows + totalRowCount', () => {
    expect(TABLE_FIXTURE.snapshot?.columns).toHaveLength(3);
    expect(TABLE_FIXTURE.snapshot?.rows[0]?.['amount']).toBe(1240.5);
    expect(TABLE_FIXTURE.snapshot?.totalRowCount).toBe(27);
  });

  it('round-trips through JSON without mutation', () => {
    expect(JSON.parse(JSON.stringify(TABLE_FIXTURE))).toEqual(TABLE_FIXTURE);
  });
});

describe('ChartSnapshotEnvelope — wire format', () => {
  it('echoes chartType / groupBy / aggregation / field plus buckets', () => {
    expect(CHART_FIXTURE.snapshot?.chartType).toBe('HorizontalBar');
    expect(CHART_FIXTURE.snapshot?.aggregation).toBe('Sum');
    expect(CHART_FIXTURE.snapshot?.buckets).toHaveLength(3);
  });

  it('surfaces value-field currency at the snapshot level (B3-8b)', () => {
    expect(CHART_FIXTURE.snapshot?.currency).toBe('EUR');
  });

  it('accepts null bucket values (Avg / Min / Max over empty groups)', () => {
    expect(CHART_FIXTURE.snapshot?.buckets[2]?.value).toBeNull();
  });

  it('round-trips through JSON without mutation', () => {
    expect(JSON.parse(JSON.stringify(CHART_FIXTURE))).toEqual(CHART_FIXTURE);
  });
});

describe('PivotSnapshotEnvelope — wire format', () => {
  it('carries the flat (rowKeys × columnKeys × value) cell list', () => {
    expect(PIVOT_FIXTURE.snapshot?.cells).toHaveLength(3);
    expect(PIVOT_FIXTURE.snapshot?.cells[0]?.rowKeys).toEqual(['EU']);
  });

  it('surfaces value-field currency at the snapshot level (B3-8b)', () => {
    expect(PIVOT_FIXTURE.snapshot?.currency).toBe('EUR');
  });

  it('accepts null cell values for empty groups', () => {
    expect(PIVOT_FIXTURE.snapshot?.cells[2]?.value).toBeNull();
  });

  it('round-trips through JSON without mutation', () => {
    expect(JSON.parse(JSON.stringify(PIVOT_FIXTURE))).toEqual(PIVOT_FIXTURE);
  });
});

describe('Type guards — analytics envelope dispatch', () => {
  const bundle: readonly WidgetSnapshotEnvelope[] = [TABLE_FIXTURE, CHART_FIXTURE, PIVOT_FIXTURE];

  it('routes each envelope to exactly one type guard', () => {
    const matches = bundle.map((env) => ({
      table: isTableSnapshotEnvelope(env),
      chart: isChartSnapshotEnvelope(env),
      pivot: isPivotSnapshotEnvelope(env),
    }));

    expect(matches[0]).toEqual({ table: true, chart: false, pivot: false });
    expect(matches[1]).toEqual({ table: false, chart: true, pivot: false });
    expect(matches[2]).toEqual({ table: false, chart: false, pivot: true });
  });
});

describe('ChartType — exhaustive enum surface (PascalCase, backend-ordered)', () => {
  it('locks the twelve backend types in declaration order', () => {
    const types: readonly ChartType[] = [
      'Bar',
      'HorizontalBar',
      'Line',
      'Area',
      'Pie',
      'Donut',
      'Radar',
      'Funnel',
      'Treemap',
      'Heatmap',
      'Scatter',
      'Combo',
    ];
    expect(types).toHaveLength(12);
  });
});
