import { describe, expect, it } from 'vitest';

import type {
  WidgetAction,
  WidgetActionKind,
  WidgetActionTrigger,
} from '../types/widget-action.js';

// Pinned wire-format fixtures. Mirror what the backend
// `Granit.Dashboards.Abstractions.WidgetAction` serialises through
// `JsonStringEnumConverter()` (no naming policy → enums stay PascalCase).

const NAVIGATE_FIXTURE = {
  trigger: 'Click',
  kind: 'Navigate',
  target: '/invoicing?status=unpaid',
  params: null,
} as const;

const ROW_CLICK_FIXTURE = {
  trigger: 'RowClick',
  kind: 'OpenDetail',
  target: 'InvoiceDetailDrawer',
  params: { invoiceId: '${row.id}' },
} as const;

const EXPORT_FIXTURE = {
  trigger: 'LegendClick',
  kind: 'ExportData',
  target: 'Granit.Invoicing.UnpaidInvoicesExport',
  params: { format: 'csv' },
} as const;

describe('WidgetAction — wire format', () => {
  it('accepts a Navigate click action verbatim', () => {
    const action: WidgetAction = NAVIGATE_FIXTURE;
    expect(action.trigger).toBe('Click');
    expect(action.kind).toBe('Navigate');
    expect(action.target).toBe('/invoicing?status=unpaid');
  });

  it('accepts a row-click drill-down with substituted params', () => {
    const action: WidgetAction = ROW_CLICK_FIXTURE;
    expect(action.params?.invoiceId).toBe('${row.id}');
  });

  it('round-trips through JSON without mutation', () => {
    for (const fixture of [NAVIGATE_FIXTURE, ROW_CLICK_FIXTURE, EXPORT_FIXTURE]) {
      expect(JSON.parse(JSON.stringify(fixture))).toEqual(fixture);
    }
  });
});

describe('WidgetActionTrigger — exhaustive enum surface', () => {
  it('locks the four backend triggers (Click / RowClick / SeriesClick / LegendClick)', () => {
    const triggers: readonly WidgetActionTrigger[] = [
      'Click',
      'RowClick',
      'SeriesClick',
      'LegendClick',
    ];
    expect(triggers).toHaveLength(4);
  });
});

describe('WidgetActionKind — exhaustive enum surface', () => {
  it('locks the five backend dispatch kinds', () => {
    const kinds: readonly WidgetActionKind[] = [
      'Navigate',
      'OpenDashboardView',
      'OpenDashboard',
      'ExportData',
      'OpenDetail',
    ];
    expect(kinds).toHaveLength(5);
  });
});
