import { describe, expect, it } from 'vitest';

import { analyticsWidgetCatalog } from '../editor/analytics-widget-catalog.js';

describe('analyticsWidgetCatalog', () => {
  it('ships entries for the four analytics widget kinds (kpi / chart / table / pivot)', () => {
    expect(analyticsWidgetCatalog.map((entry) => entry.type)).toEqual([
      'kpi',
      'chart',
      'table',
      'pivot',
    ]);
  });

  it('factories produce widgets whose declared type matches the entry', () => {
    for (const entry of analyticsWidgetCatalog) {
      const created = entry.createDefaultWidget('Tmp', 0);
      expect(created.type).toBe(entry.type);
    }
  });

  it('chart and pivot factories default to `Sum` (the most common aggregation)', () => {
    const chart = analyticsWidgetCatalog.find((e) => e.type === 'chart');
    const pivot = analyticsWidgetCatalog.find((e) => e.type === 'pivot');
    if (!chart || !pivot) throw new Error('catalog incomplete');
    const chartWidget = chart.createDefaultWidget('C', 0) as { aggregation: string };
    const pivotWidget = pivot.createDefaultWidget('P', 0) as { valueAggregation: string };
    expect(chartWidget.aggregation).toBe('Sum');
    expect(pivotWidget.valueAggregation).toBe('Sum');
  });

  it('kpi factory produces a metric datasource (the common case)', () => {
    const kpi = analyticsWidgetCatalog.find((e) => e.type === 'kpi');
    if (!kpi) throw new Error('kpi entry missing');
    const widget = kpi.createDefaultWidget('K', 0) as { datasource: { kind: string } };
    expect(widget.datasource.kind).toBe('metric');
  });

  it('chart / table / pivot factories produce empty `queryName` placeholders for the user to fill in', () => {
    for (const type of ['chart', 'table', 'pivot'] as const) {
      const entry = analyticsWidgetCatalog.find((e) => e.type === type);
      if (!entry) throw new Error(`${type} entry missing`);
      const widget = entry.createDefaultWidget('T', 0) as { queryName: string };
      expect(widget.queryName).toBe('');
    }
  });
});
