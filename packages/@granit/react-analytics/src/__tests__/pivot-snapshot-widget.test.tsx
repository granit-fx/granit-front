import { render } from '@testing-library/react';
import i18n from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { describe, expect, it } from 'vitest';

import { PivotSnapshotWidget } from '../components/pivot-snapshot-widget.js';

import type { PivotWidgetSnapshot } from '@granit/analytics';
import type { DashboardRenderedWidget } from '@granit/dashboards';
import type { ReactNode } from 'react';

const testI18n = i18n.createInstance();
void testI18n.use(initReactI18next).init({
  lng: 'en-US',
  fallbackLng: 'en-US',
  nsSeparator: false,
  keySeparator: false,
  resources: {
    'en-US': {
      translation: {
        'Widget:Pivot.Rows': 'rows: {{fields}}',
        'Widget:Pivot.Columns': 'columns: {{fields}}',
        'Widget:Pivot.NoData': 'No data',
      },
    },
  },
  interpolation: { escapeValue: false },
});

function wrap(node: ReactNode) {
  return render(<I18nextProvider i18n={testI18n}>{node}</I18nextProvider>);
}

const ENVELOPE_BASE = {
  id: '8c6b1e10-0000-0000-0000-000000000001',
  status: 'Snapshot' as const,
  sequence: 1,
  emittedAt: '2026-04-29T12:34:56.789Z',
  refreshHint: 'Dynamic' as const,
  reasonLocalizationKey: null,
};

function pivotEnvelope(snapshot: PivotWidgetSnapshot): DashboardRenderedWidget {
  return { ...ENVELOPE_BASE, widgetType: 'Pivot', snapshot };
}

const SAMPLE_SNAPSHOT: PivotWidgetSnapshot = {
  rowFields: ['Region'],
  columnFields: ['Status'],
  valueField: 'Total',
  aggregation: 'Sum',
  cells: [
    { rowKeys: ['EU'], columnKeys: ['Open'], value: 9500 },
    { rowKeys: ['EU'], columnKeys: ['Paid'], value: 12300 },
    { rowKeys: ['NA'], columnKeys: ['Open'], value: 4200 },
    { rowKeys: ['NA'], columnKeys: ['Paid'], value: null },
  ],
  currency: 'EUR',
};

const normalizeSpaces = (s: string) => s.replace(/[\u0020\u00A0\u202F]+/g, ' ');

describe('PivotSnapshotWidget — matrix layout', () => {
  it('pivots the flat cell list into a row-major matrix', () => {
    const { container } = wrap(<PivotSnapshotWidget widget={pivotEnvelope(SAMPLE_SNAPSHOT)} />);
    const rows = container.querySelectorAll('[data-slot="pivot-snapshot-row"]');
    expect(rows).toHaveLength(2);
    expect(rows[0]?.getAttribute('data-row-tuple')).toBe('EU');
    expect(rows[1]?.getAttribute('data-row-tuple')).toBe('NA');

    const headers = container.querySelectorAll('thead th[data-column-tuple]');
    expect(headers).toHaveLength(2);
    expect(headers[0]?.getAttribute('data-column-tuple')).toBe('Open');
    expect(headers[1]?.getAttribute('data-column-tuple')).toBe('Paid');
  });

  it('formats every cell with the snapshot-level currency code (B3-8b)', () => {
    const { container } = wrap(<PivotSnapshotWidget widget={pivotEnvelope(SAMPLE_SNAPSHOT)} />);
    const euRow = container.querySelector('[data-row-tuple="EU"]');
    const cells = euRow?.querySelectorAll('td[data-column-tuple]') ?? [];
    expect(normalizeSpaces(cells[0]?.textContent ?? '')).toBe('€9,500.00');
    expect(normalizeSpaces(cells[1]?.textContent ?? '')).toBe('€12,300.00');
  });

  it('renders an em dash for null cell values (empty Avg/Min/Max groups)', () => {
    const { container } = wrap(<PivotSnapshotWidget widget={pivotEnvelope(SAMPLE_SNAPSHOT)} />);
    const naRow = container.querySelector('[data-row-tuple="NA"]');
    const cells = naRow?.querySelectorAll('td[data-column-tuple]') ?? [];
    expect(cells[1]?.textContent).toBe('—');
  });

  it('falls back to plain locale formatting when no currency is declared', () => {
    const snapshot: PivotWidgetSnapshot = {
      ...SAMPLE_SNAPSHOT,
      currency: null,
      cells: [{ rowKeys: ['EU'], columnKeys: ['Open'], value: 1234 }],
    };
    const { container } = wrap(<PivotSnapshotWidget widget={pivotEnvelope(snapshot)} />);
    const cell = container.querySelector('[data-row-tuple="EU"] td[data-column-tuple]');
    expect(cell?.textContent).toBe('1,234');
  });

  it('renders an empty-state row when the snapshot ships zero cells', () => {
    const snapshot: PivotWidgetSnapshot = {
      ...SAMPLE_SNAPSHOT,
      cells: [],
    };
    const { container, getByText } = wrap(<PivotSnapshotWidget widget={pivotEnvelope(snapshot)} />);
    expect(container.querySelector('[data-slot="pivot-snapshot-empty"]')).not.toBeNull();
    expect(getByText('No data')).toBeInTheDocument();
  });

  it('handles multi-key tuples on row and column dimensions', () => {
    const snapshot: PivotWidgetSnapshot = {
      rowFields: ['Region', 'Country'],
      columnFields: ['Year', 'Quarter'],
      valueField: null,
      aggregation: 'Count',
      cells: [
        { rowKeys: ['EU', 'FR'], columnKeys: ['2026', 'Q1'], value: 12 },
        { rowKeys: ['EU', 'BE'], columnKeys: ['2026', 'Q1'], value: 4 },
      ],
      currency: null,
    };
    const { container } = wrap(<PivotSnapshotWidget widget={pivotEnvelope(snapshot)} />);
    const rows = container.querySelectorAll('[data-slot="pivot-snapshot-row"]');
    expect(rows).toHaveLength(2);
    expect(rows[0]?.getAttribute('data-row-tuple')).toBe('EU|FR');
    expect(rows[1]?.getAttribute('data-row-tuple')).toBe('EU|BE');
    const headers = container.querySelectorAll('thead th[data-column-tuple]');
    expect(headers[0]?.getAttribute('data-column-tuple')).toBe('2026|Q1');
  });

  it('shows the aggregation label + currency in the meta line', () => {
    const { container } = wrap(<PivotSnapshotWidget widget={pivotEnvelope(SAMPLE_SNAPSHOT)} />);
    const meta = container.querySelector('[data-slot="pivot-snapshot-meta"]');
    expect(meta?.textContent).toContain('Sum(Total)');
    expect(meta?.textContent).toContain('EUR');
  });

  it('drops the field segment when aggregation is Count (no valueField)', () => {
    const snapshot: PivotWidgetSnapshot = {
      ...SAMPLE_SNAPSHOT,
      valueField: null,
      aggregation: 'Count',
    };
    const { container } = wrap(<PivotSnapshotWidget widget={pivotEnvelope(snapshot)} />);
    const meta = container.querySelector('[data-slot="pivot-snapshot-meta"]');
    expect(meta?.textContent).toContain('Count');
    expect(meta?.textContent).not.toContain('(Total)');
  });

  it('returns null on an Unavailable status', () => {
    const widget: DashboardRenderedWidget = {
      ...ENVELOPE_BASE,
      widgetType: 'Pivot',
      status: 'Unavailable',
      snapshot: null,
      reasonLocalizationKey: 'Widget:Unavailable',
    };
    const { container } = render(<PivotSnapshotWidget widget={widget} />);
    expect(container.firstChild).toBeNull();
  });
});
