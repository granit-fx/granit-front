import { createApiClient } from '@granit/api-client';
import { GranitClientProvider } from '@granit/react-api-client';
import { createQueryWrapper } from '@granit/react-testing';
import { render, screen } from '@testing-library/react';
import i18n from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { describe, expect, it } from 'vitest';

import { KpiTile } from '../components/kpi-tile';

import type { KpiWidgetDefinition } from '@granit/analytics';
import type { ReactNode } from 'react';

const testI18n = i18n.createInstance();
void testI18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  nsSeparator: false,
  keySeparator: false,
  resources: { en: { translation: {} } },
  interpolation: { escapeValue: false },
});

const QueryWrapper = createQueryWrapper();
const apiClient = createApiClient({ baseURL: '/api' });

function renderTile(node: ReactNode) {
  return render(
    <QueryWrapper>
      <GranitClientProvider client={apiClient}>
        <I18nextProvider i18n={testI18n}>{node}</I18nextProvider>
      </GranitClientProvider>
    </QueryWrapper>
  );
}

const baseKpi = {
  slug: 'UnpaidCount',
  type: 'kpi',
  position: 0,
  size: { width: 3, height: 2 },
} as const;

describe('KpiTile (smart) — datasource guards', () => {
  it('renders the unsupported tile (no crash) when `datasource` is undefined', () => {
    // Regression: a persisted KPI whose `configJson` failed to parse — or a
    // pre-fix flat-spread instance — reaches the renderer with no datasource.
    // The guard must treat it like the "unsupported" branch, not crash on
    // `isMetricDatasource(undefined)` / `datasource.kind`.
    const widget = { ...baseKpi, datasource: undefined } as unknown as KpiWidgetDefinition;
    const { container } = renderTile(<KpiTile widget={widget} />);
    const tile = container.querySelector('[data-slot="kpi-tile"]');
    expect(tile).toBeInTheDocument();
    expect(tile?.getAttribute('data-datasource-kind')).toBe('none');
  });

  it('renders the unsupported tile for a non-metric datasource kind', () => {
    const widget = {
      ...baseKpi,
      datasource: {
        kind: 'iot-telemetry',
        entityAlias: 'sensor',
        telemetryKey: 'temp',
        aggregation: 'Last',
        keyFormats: null,
      },
    } as unknown as KpiWidgetDefinition;
    const { container } = renderTile(<KpiTile widget={widget} />);
    expect(
      container.querySelector('[data-slot="kpi-tile"]')?.getAttribute('data-datasource-kind')
    ).toBe('iot-telemetry');
  });

  it('binds a metric datasource and renders the value tile', () => {
    const widget = {
      ...baseKpi,
      datasource: { kind: 'metric', metricName: 'Granit.Invoicing.UnpaidInvoiceCountMetric' },
    } as KpiWidgetDefinition;
    renderTile(<KpiTile widget={widget} />);
    // Metric branch mounts <KpiTileView> (loading skeleton while the disabled/
    // pending query settles) — not the unsupported text node.
    expect(screen.queryByText(/not supported/i)).toBeNull();
  });
});
