import { render } from '@testing-library/react';
import i18n from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { describe, expect, it } from 'vitest';

import { TableSnapshotWidget } from '../components/table-snapshot-widget.js';

import type { TableWidgetSnapshot } from '@granit/analytics';
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
        'Column:Invoice.Number': 'Invoice #',
        'Column:Invoice.Amount': 'Amount',
        'Column:Invoice.Status': 'Status',
        'Widget:Table.ShowingNofM': 'Showing {{shown}} of {{total}}',
        'Widget:Table.NoData': 'No data',
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

function tableEnvelope(snapshot: TableWidgetSnapshot): DashboardRenderedWidget {
  return { ...ENVELOPE_BASE, widgetType: 'Table', snapshot };
}

const SAMPLE_SNAPSHOT: TableWidgetSnapshot = {
  columns: [
    { name: 'invoiceNumber', labelLocalizationKey: 'Column:Invoice.Number' },
    { name: 'amount', labelLocalizationKey: 'Column:Invoice.Amount', currencyCode: 'EUR' },
    { name: 'status', labelLocalizationKey: 'Column:Invoice.Status' },
  ],
  rows: [
    { invoiceNumber: 'INV-2026-0042', amount: 1240.5, status: 'Open' },
    { invoiceNumber: 'INV-2026-0043', amount: 890, status: 'Paid' },
  ],
  totalRowCount: 27,
};

const normalizeSpaces = (s: string) => s.replace(/[\u0020\u00A0\u202F]+/g, ' ');

describe('TableSnapshotWidget — rendering', () => {
  it('renders one row per snapshot.rows entry with localized headers', () => {
    const { container, getByText } = wrap(
      <TableSnapshotWidget widget={tableEnvelope(SAMPLE_SNAPSHOT)} />
    );
    expect(getByText('Invoice #')).toBeInTheDocument();
    expect(getByText('Amount')).toBeInTheDocument();
    expect(getByText('Status')).toBeInTheDocument();
    expect(container.querySelectorAll('[data-slot="table-snapshot-row"]')).toHaveLength(2);
  });

  it('shows the "Showing N of M" affordance from totalRowCount', () => {
    const { getByText } = wrap(<TableSnapshotWidget widget={tableEnvelope(SAMPLE_SNAPSHOT)} />);
    expect(getByText('Showing 2 of 27')).toBeInTheDocument();
  });

  it('formats numeric cells with the column-declared currency code (B3-8b)', () => {
    const { container } = wrap(<TableSnapshotWidget widget={tableEnvelope(SAMPLE_SNAPSHOT)} />);
    const amountCells = container.querySelectorAll('[data-column-name="amount"]');
    // First match is the header <th>; subsequent ones are <td>.
    const firstRowAmount = amountCells[1];
    expect(normalizeSpaces(firstRowAmount?.textContent ?? '')).toBe('€1,240.50');
  });

  it('falls back to plain locale formatting when the column declares no currency', () => {
    const snapshot: TableWidgetSnapshot = {
      ...SAMPLE_SNAPSHOT,
      columns: [{ name: 'count', labelLocalizationKey: null }],
      rows: [{ count: 1234 }],
      totalRowCount: 1,
    };
    const { container } = wrap(<TableSnapshotWidget widget={tableEnvelope(snapshot)} />);
    const cells = container.querySelectorAll('[data-column-name="count"]');
    expect(cells[1]?.textContent).toBe('1,234');
  });

  it('renders an empty-state row when no data', () => {
    const snapshot: TableWidgetSnapshot = {
      columns: [{ name: 'id', labelLocalizationKey: null }],
      rows: [],
      totalRowCount: 0,
    };
    const { container, getByText } = wrap(<TableSnapshotWidget widget={tableEnvelope(snapshot)} />);
    expect(container.querySelector('[data-slot="table-snapshot-empty"]')).not.toBeNull();
    expect(getByText('No data')).toBeInTheDocument();
  });

  it('renders the column name verbatim when labelLocalizationKey is null', () => {
    const snapshot: TableWidgetSnapshot = {
      columns: [{ name: 'rawColumnName', labelLocalizationKey: null }],
      rows: [{ rawColumnName: 'value' }],
      totalRowCount: 1,
    };
    const { getByText } = wrap(<TableSnapshotWidget widget={tableEnvelope(snapshot)} />);
    expect(getByText('rawColumnName')).toBeInTheDocument();
  });

  it('renders an em dash for null and undefined cell values', () => {
    const snapshot: TableWidgetSnapshot = {
      columns: [
        { name: 'absent', labelLocalizationKey: null },
        { name: 'nulled', labelLocalizationKey: null },
      ],
      rows: [{ nulled: null }],
      totalRowCount: 1,
    };
    const { container } = wrap(<TableSnapshotWidget widget={tableEnvelope(snapshot)} />);
    const cells = container.querySelectorAll('[data-slot="table-snapshot-row"] td');
    expect(cells[0]?.textContent).toBe('—');
    expect(cells[1]?.textContent).toBe('—');
  });

  it('returns null on an Unavailable status', () => {
    const widget: DashboardRenderedWidget = {
      ...ENVELOPE_BASE,
      widgetType: 'Table',
      status: 'Unavailable',
      snapshot: null,
      reasonLocalizationKey: 'Widget:Unavailable',
    };
    const { container } = render(<TableSnapshotWidget widget={widget} />);
    expect(container.firstChild).toBeNull();
  });
});
