import { QueryCatalogProvider } from '@granit/react-query-engine';
import { createTestQueryClient } from '@granit/react-testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, waitFor } from '@testing-library/react';
import axios from 'axios';
import i18n from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { TableConfigForm } from '../editor/table-config-form';

import type { TableWidgetDefinition } from '@granit/analytics';
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

const baseTable: TableWidgetDefinition = {
  slug: 'T',
  type: 'table',
  position: 0,
  size: { width: 6, height: 3 },
  queryName: 'Granit.Test.Query',
  visibleColumns: null,
  pageSize: 25,
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
            { name: 'Name', label: 'Name', type: 'String' },
            { name: 'Amount', label: 'Amount', type: 'Decimal' },
          ],
          groupByFields: [],
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

describe('TableConfigForm', () => {
  it('falls back to free-text inputs without a catalogue provider', () => {
    const { container } = wrap(<TableConfigForm widget={baseTable} onChange={vi.fn()} />);
    expect(container.querySelector('input[data-slot="table-query-name"]')).not.toBeNull();
    expect(container.querySelector('input[data-slot="table-visible-columns"]')).not.toBeNull();
  });

  it('parses comma-separated columns into the visibleColumns array', () => {
    const onChange = vi.fn();
    const { container } = wrap(<TableConfigForm widget={baseTable} onChange={onChange} />);
    const input = container.querySelector('[data-slot="table-visible-columns"]');
    if (!(input instanceof HTMLInputElement)) throw new Error('input not found');
    fireEvent.change(input, { target: { value: 'Name, Amount' } });
    expect(onChange.mock.calls[0]?.[0]?.visibleColumns).toEqual(['Name', 'Amount']);
  });

  it('renders a column multi-select from query metadata', async () => {
    const { container } = wrap(
      <TableConfigForm widget={baseTable} onChange={vi.fn()} />,
      mockCatalogClient()
    );
    await waitFor(() =>
      expect(container.querySelector('select[data-slot="table-visible-columns"]')).not.toBeNull()
    );
    const select = container.querySelector('select[data-slot="table-visible-columns"]');
    expect(select?.hasAttribute('multiple')).toBe(true);
    expect(select?.querySelector('option[value="Name"]')).not.toBeNull();
    expect(select?.querySelector('option[value="Amount"]')).not.toBeNull();
  });
});
