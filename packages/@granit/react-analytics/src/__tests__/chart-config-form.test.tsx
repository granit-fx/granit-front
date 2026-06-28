import { QueryCatalogProvider } from '@granit/react-query-engine';
import { createTestQueryClient } from '@granit/react-testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import i18n from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ChartConfigForm } from '../editor/chart-config-form';

import type { ChartWidgetDefinition } from '@granit/analytics';
import type { AxiosInstance } from '@granit/api-client';
import type { ReactNode } from 'react';

const testI18n = i18n.createInstance();
void testI18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  nsSeparator: false,
  keySeparator: false,
  // `Sales` is a module-name i18n key (→ `Ventes`); `Test` is absent → raw fallback.
  resources: { en: { translation: { 'Entity:Patient': 'Patients', Sales: 'Ventes' } } },
  interpolation: { escapeValue: false },
});

const baseChart: ChartWidgetDefinition = {
  slug: 'C',
  type: 'chart',
  position: 0,
  size: { width: 6, height: 3 },
  queryName: 'Granit.Test.Query',
  groupBy: 'Status',
  aggregation: 'Sum',
  field: 'Amount',
  chartType: 'Bar',
};

/** A mock client answering /catalog and /meta by URL. */
function mockCatalogClient() {
  const client = axios.create();
  vi.spyOn(client, 'get').mockImplementation((url: string) => {
    if (url.endsWith('/catalog')) {
      return Promise.resolve({
        data: [
          // labelKey resolved via the i18n bundle.
          {
            moduleName: 'Test',
            name: 'Granit.Test.Query',
            basePath: '/api/v1/patients',
            labelKey: 'Entity:Patient',
          },
          // labelKey absent from the bundle → humanised last segment of the name.
          {
            moduleName: 'Sales',
            name: 'Granit.Sales.RevenueByRegionQuery',
            basePath: '/api/v1/revenue',
            labelKey: 'Query:Granit.Sales.RevenueByRegionQuery',
          },
          // Unrouted (basePath null) → hidden from the dropdown.
          {
            moduleName: 'Test',
            name: 'Granit.Test.UnroutedQuery',
            basePath: null,
            labelKey: 'Query:x',
          },
        ],
      });
    }
    if (url.endsWith('/meta')) {
      return Promise.resolve({
        data: {
          columns: [
            { name: 'Amount', label: 'Amount', type: 'Decimal' },
            { name: 'Name', label: 'Name', type: 'String' },
          ],
          groupByFields: [{ name: 'Status', type: 'String' }],
        },
      });
    }
    return Promise.reject(new Error(`unexpected url ${url}`));
  });
  return client as AxiosInstance;
}

function wrap(node: ReactNode, client?: AxiosInstance) {
  const queryClient = createTestQueryClient();
  return render(
    <I18nextProvider i18n={testI18n}>
      <QueryClientProvider client={queryClient}>
        {client ? (
          <QueryCatalogProvider config={{ client, basePath: '/api/v1' }}>
            {node}
          </QueryCatalogProvider>
        ) : (
          node
        )}
      </QueryClientProvider>
    </I18nextProvider>
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('ChartConfigForm', () => {
  it('renders combobox + select triggers for every field', () => {
    const { container } = wrap(<ChartConfigForm widget={baseChart} onChange={vi.fn()} />);
    for (const slot of [
      'chart-query-name',
      'chart-group-by',
      'chart-aggregation',
      'chart-field',
      'chart-type',
    ]) {
      expect(container.querySelector(`[data-slot="${slot}"]`)).not.toBeNull();
    }
  });

  it('disables the field control for Count aggregation', () => {
    const countChart: ChartWidgetDefinition = { ...baseChart, aggregation: 'Count', field: null };
    const { container } = wrap(<ChartConfigForm widget={countChart} onChange={vi.fn()} />);
    const field = container.querySelector('[data-slot="chart-field"]');
    expect((field as HTMLButtonElement).disabled).toBe(true);
  });

  it('picks a query from the catalogue combobox', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const emptyChart: ChartWidgetDefinition = { ...baseChart, queryName: '' };
    const { container } = wrap(
      <ChartConfigForm widget={emptyChart} onChange={onChange} />,
      mockCatalogClient()
    );

    await user.click(container.querySelector('[data-slot="chart-query-name"]')!);
    await user.click(await screen.findByRole('option', { name: 'Patients' }));
    expect(onChange.mock.calls.at(-1)?.[0]?.queryName).toBe('Granit.Test.Query');
  });

  it('groups queries under their module heading, resolving moduleName via i18n', async () => {
    const user = userEvent.setup();
    const emptyChart: ChartWidgetDefinition = { ...baseChart, queryName: '' };
    const { container } = wrap(
      <ChartConfigForm widget={emptyChart} onChange={vi.fn()} />,
      mockCatalogClient()
    );

    await user.click(container.querySelector('[data-slot="chart-query-name"]')!);
    await screen.findByRole('option', { name: 'Patients' });
    // moduleName is an i18n key: 'Sales' → 'Ventes'; 'Test' is absent → raw fallback.
    expect(screen.getByText('Ventes')).toBeInTheDocument();
    expect(screen.getByText('Test')).toBeInTheDocument();
    const labels = screen.getAllByRole('option').map((o) => o.textContent ?? '');
    const patients = labels.findIndex((l) => l.includes('Patients')); // module 'Test'
    const revenue = labels.findIndex((l) => l.includes('Revenue By Region Query')); // 'Ventes'
    // Groups ordered by the RESOLVED heading asc: 'Test' before 'Ventes'.
    expect(patients).toBeGreaterThanOrEqual(0);
    expect(patients).toBeLessThan(revenue);
  });

  it('resolves labelKey via i18n / humanises the fallback and hides unrouted queries', async () => {
    const user = userEvent.setup();
    const emptyChart: ChartWidgetDefinition = { ...baseChart, queryName: '' };
    const { container } = wrap(
      <ChartConfigForm widget={emptyChart} onChange={vi.fn()} />,
      mockCatalogClient()
    );

    await user.click(container.querySelector('[data-slot="chart-query-name"]')!);
    // labelKey present in the bundle → translated.
    expect(await screen.findByRole('option', { name: 'Patients' })).toBeInTheDocument();
    // labelKey absent → humanised last segment of the name.
    expect(screen.getByRole('option', { name: 'Revenue By Region Query' })).toBeInTheDocument();
    // basePath === null → hidden (its humanised label would be "Unrouted Query").
    expect(screen.queryByRole('option', { name: 'Unrouted Query' })).toBeNull();
  });

  it('sources Group By from group-by fields and Field from numeric columns only', async () => {
    const user = userEvent.setup();
    const { container } = wrap(
      <ChartConfigForm widget={baseChart} onChange={vi.fn()} />,
      mockCatalogClient()
    );

    await user.click(container.querySelector('[data-slot="chart-group-by"]')!);
    expect(await screen.findByRole('option', { name: 'Status' })).toBeInTheDocument();
    await user.keyboard('{Escape}');

    await user.click(container.querySelector('[data-slot="chart-field"]')!);
    expect(await screen.findByRole('option', { name: 'Amount' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Name' })).toBeNull();
  });
});
