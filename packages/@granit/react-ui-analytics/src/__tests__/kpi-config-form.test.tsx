import { Datasource } from '@granit/dashboards';
import { GranitClientProvider } from '@granit/react-api-client';
import { createTestQueryClient } from '@granit/react-testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import i18n from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { KpiConfigForm } from '../components/kpi-config-form';

import type { KpiWidgetDefinition, MetricCatalogEntryResponse } from '@granit/analytics';
import type { AxiosInstance } from '@granit/api-client';
import type { ReactNode } from 'react';

const mockCatalog: readonly MetricCatalogEntryResponse[] = [
  {
    name: 'Granit.Test.Revenue',
    label: 'Revenue',
    valueKind: 'Currency',
    aggregation: 'Sum',
    isHigherBetter: true,
    refreshHint: 'Dynamic',
    currencyCode: 'EUR',
  },
];

/** A mock client answering GET /metrics/catalog with {@link mockCatalog}. */
function mockCatalogClient() {
  const client = axios.create();
  vi.spyOn(client, 'get').mockResolvedValue({ data: mockCatalog });
  return client as AxiosInstance;
}

const testI18n = i18n.createInstance();
void testI18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  nsSeparator: false,
  keySeparator: false,
  resources: { en: { translation: {} } },
  interpolation: { escapeValue: false },
});

function wrap(node: ReactNode, client?: AxiosInstance) {
  const queryClient = createTestQueryClient();
  return render(
    <I18nextProvider i18n={testI18n}>
      <QueryClientProvider client={queryClient}>
        {client ? <GranitClientProvider client={client}>{node}</GranitClientProvider> : node}
      </QueryClientProvider>
    </I18nextProvider>
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

const baseKpi: KpiWidgetDefinition = {
  slug: 'K',
  type: 'kpi',
  position: 0,
  size: { width: 3, height: 1 },
  datasource: Datasource.metric('Granit.Test.Metric'),
};

describe('KpiConfigForm', () => {
  it('shows the metric combobox when bound to a metric datasource', () => {
    const { container } = wrap(<KpiConfigForm widget={baseKpi} onChange={vi.fn()} />);
    expect(container.querySelector('[data-slot="kpi-metric-name"]')).not.toBeNull();
    expect(container.querySelector('[data-slot="kpi-query-name"]')).toBeNull();
  });

  it('emits a typed metric name via the searchable combobox', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container } = wrap(<KpiConfigForm widget={baseKpi} onChange={onChange} />);

    await user.click(container.querySelector('[data-slot="kpi-metric-name"]')!);
    await user.type(
      await screen.findByPlaceholderText('Search or type a metric name…'),
      'Granit.Test.NewMetric'
    );
    await user.click(await screen.findByRole('option', { name: /Granit\.Test\.NewMetric/ }));

    expect(onChange.mock.calls.at(-1)?.[0]?.datasource).toEqual(
      Datasource.metric('Granit.Test.NewMetric')
    );
  });

  it('picks a metric from the catalogue combobox', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const emptyKpi: KpiWidgetDefinition = { ...baseKpi, datasource: Datasource.metric('') };
    const { container } = wrap(
      <KpiConfigForm widget={emptyKpi} onChange={onChange} />,
      mockCatalogClient()
    );

    await user.click(container.querySelector('[data-slot="kpi-metric-name"]')!);
    await user.click(await screen.findByRole('option', { name: 'Revenue' }));

    expect(onChange.mock.calls.at(-1)?.[0]?.datasource).toEqual(
      Datasource.metric('Granit.Test.Revenue')
    );
  });

  it('switches to query-aggregate from the kind select', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container } = wrap(<KpiConfigForm widget={baseKpi} onChange={onChange} />);

    await user.click(container.querySelector('[data-slot="kpi-datasource-kind"]')!);
    await user.click(await screen.findByRole('option', { name: 'Query aggregate' }));

    expect(onChange.mock.calls.at(-1)?.[0]?.datasource?.kind).toBe('query-aggregate');
  });

  it('shows the query combobox + aggregation when bound to query-aggregate', () => {
    const queryKpi: KpiWidgetDefinition = {
      ...baseKpi,
      datasource: Datasource.queryAggregate('Granit.Test.Query', 'Sum'),
    };
    const { container } = wrap(<KpiConfigForm widget={queryKpi} onChange={vi.fn()} />);
    expect(container.querySelector('[data-slot="kpi-query-name"]')).not.toBeNull();
    expect(container.querySelector('[data-slot="kpi-aggregation"]')).not.toBeNull();
  });
});
