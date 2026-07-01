import { QueryCatalogProvider } from '@granit/react-query-engine';
import { createTestQueryClient } from '@granit/react-testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import i18n from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { TableConfigForm } from '../components/table-config-form';

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
        data: [
          {
            moduleName: 'Test',
            name: 'Granit.Test.Query',
            basePath: '/api/v1/patients',
            labelKey: 'Entity:Patient',
          },
        ],
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
  it('renders the query combobox, the columns multi-select and the page-size input', () => {
    const { container } = wrap(<TableConfigForm widget={baseTable} onChange={vi.fn()} />);
    expect(container.querySelector('[data-slot="table-query-name"]')).not.toBeNull();
    expect(container.querySelector('[data-slot="table-visible-columns"]')).not.toBeNull();
    expect(container.querySelector('input[data-slot="table-page-size"]')).not.toBeNull();
  });

  it('emits page-size changes', () => {
    const onChange = vi.fn();
    const { container } = wrap(<TableConfigForm widget={baseTable} onChange={onChange} />);
    const input = container.querySelector('input[data-slot="table-page-size"]');
    fireEvent.change(input!, { target: { value: '50' } });
    expect(onChange.mock.calls.at(-1)?.[0]?.pageSize).toBe(50);
  });

  it('toggles a visible column from the metadata multi-select', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container } = wrap(
      <TableConfigForm widget={baseTable} onChange={onChange} />,
      mockCatalogClient()
    );

    await user.click(container.querySelector('[data-slot="table-visible-columns"]')!);
    expect(await screen.findByRole('option', { name: 'Name' })).toBeInTheDocument();
    await user.click(await screen.findByRole('option', { name: 'Amount' }));
    expect(onChange.mock.calls.at(-1)?.[0]?.visibleColumns).toEqual(['Amount']);
  });
});
