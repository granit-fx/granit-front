import { QueryCatalogProvider } from '@granit/react-query-engine';
import { createTestQueryClient } from '@granit/react-testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, waitFor } from '@testing-library/react';
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
  resources: { en: { translation: {} } },
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
        data: [{ name: 'Granit.Test.Query', basePath: '/api/v1/patients', label: 'Patients' }],
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
  it('falls back to free-text inputs without a catalogue provider', () => {
    const { container } = wrap(<ChartConfigForm widget={baseChart} onChange={vi.fn()} />);
    expect(container.querySelector('input[data-slot="chart-query-name"]')).not.toBeNull();
    expect(container.querySelector('input[data-slot="chart-group-by"]')).not.toBeNull();
    expect(container.querySelector('input[data-slot="chart-field"]')).not.toBeNull();
    // No catalogue → no suggestions datalist.
    expect(container.querySelector('#chart-query-name-options')).toBeNull();
  });

  it('emits queryName changes from the free-text input', () => {
    const onChange = vi.fn();
    const { container } = wrap(<ChartConfigForm widget={baseChart} onChange={onChange} />);
    const input = container.querySelector('[data-slot="chart-query-name"]');
    if (!(input instanceof HTMLInputElement)) throw new Error('input not found');
    fireEvent.change(input, { target: { value: 'Granit.Other.Query' } });
    expect(onChange.mock.calls[0]?.[0]?.queryName).toBe('Granit.Other.Query');
  });

  it('renders catalogue suggestions and metadata-backed dropdowns', async () => {
    const { container } = wrap(
      <ChartConfigForm widget={baseChart} onChange={vi.fn()} />,
      mockCatalogClient()
    );

    // Query combobox gains a suggestions datalist.
    await waitFor(() =>
      expect(container.querySelector('#chart-query-name-options')).not.toBeNull()
    );

    // Group by + field become <select> sourced from metadata.
    await waitFor(() =>
      expect(container.querySelector('select[data-slot="chart-group-by"]')).not.toBeNull()
    );
    const groupBy = container.querySelector('select[data-slot="chart-group-by"]');
    expect(groupBy?.querySelector('option[value="Status"]')).not.toBeNull();

    const field = container.querySelector('select[data-slot="chart-field"]');
    expect(field).not.toBeNull();
    // Numeric column offered; string column filtered out.
    expect(field?.querySelector('option[value="Amount"]')).not.toBeNull();
    expect(field?.querySelector('option[value="Name"]')).toBeNull();
  });

  it('disables the field control for Count aggregation', () => {
    const countChart: ChartWidgetDefinition = { ...baseChart, aggregation: 'Count', field: null };
    const { container } = wrap(<ChartConfigForm widget={countChart} onChange={vi.fn()} />);
    const field = container.querySelector('[data-slot="chart-field"]');
    expect(field).not.toBeNull();
    expect((field as HTMLInputElement).disabled).toBe(true);
  });
});
