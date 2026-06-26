import { QueryCatalogProvider } from '@granit/react-query-engine';
import { createTestQueryClient } from '@granit/react-testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { render, waitFor } from '@testing-library/react';
import axios from 'axios';
import i18n from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { PivotConfigForm } from '../editor/pivot-config-form';

import type { PivotWidgetDefinition } from '@granit/analytics';
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

const basePivot: PivotWidgetDefinition = {
  slug: 'P',
  type: 'pivot',
  position: 0,
  size: { width: 6, height: 3 },
  queryName: 'Granit.Test.Query',
  rowFields: ['Status'],
  columnFields: [],
  valueField: 'Amount',
  valueAggregation: 'Sum',
};

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
          groupByFields: [
            { name: 'Status', type: 'String' },
            { name: 'Region', type: 'String' },
          ],
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

describe('PivotConfigForm', () => {
  it('falls back to free-text inputs without a catalogue provider', () => {
    const { container } = wrap(<PivotConfigForm widget={basePivot} onChange={vi.fn()} />);
    expect(container.querySelector('input[data-slot="pivot-row-fields"]')).not.toBeNull();
    expect(container.querySelector('input[data-slot="pivot-value-field"]')).not.toBeNull();
  });

  it('disables the value field for Count aggregation', () => {
    const countPivot: PivotWidgetDefinition = {
      ...basePivot,
      valueAggregation: 'Count',
      valueField: null,
    };
    const { container } = wrap(<PivotConfigForm widget={countPivot} onChange={vi.fn()} />);
    const field = container.querySelector('[data-slot="pivot-value-field"]');
    expect((field as HTMLInputElement).disabled).toBe(true);
  });

  it('sources dimensions from group-by fields and value field from numeric columns', async () => {
    const { container } = wrap(
      <PivotConfigForm widget={basePivot} onChange={vi.fn()} />,
      mockCatalogClient()
    );

    await waitFor(() =>
      expect(container.querySelector('select[data-slot="pivot-row-fields"]')).not.toBeNull()
    );
    const rowFields = container.querySelector('select[data-slot="pivot-row-fields"]');
    expect(rowFields?.hasAttribute('multiple')).toBe(true);
    expect(rowFields?.querySelector('option[value="Status"]')).not.toBeNull();
    expect(rowFields?.querySelector('option[value="Region"]')).not.toBeNull();

    // Value field is a single-select of numeric columns only.
    const valueField = container.querySelector('select[data-slot="pivot-value-field"]');
    expect(valueField).not.toBeNull();
    expect(valueField?.hasAttribute('multiple')).toBe(false);
    expect(valueField?.querySelector('option[value="Amount"]')).not.toBeNull();
    expect(valueField?.querySelector('option[value="Name"]')).toBeNull();
  });
});
