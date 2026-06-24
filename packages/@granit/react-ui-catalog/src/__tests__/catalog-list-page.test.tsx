import { screen } from '@testing-library/react';
import * as React from 'react';

import { CatalogListPage } from '../catalog-list-page';

import { renderWithProviders } from './test-utils';

// Stub the query-engine so the test focuses on render — the grid handlers are
// exercised end-to-end via MSW elsewhere.
vi.mock('@granit/react-query-engine', () => ({
  QueryProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useQueryMeta: () => ({
    data: { columns: [], presetFilterGroups: [], groupByFields: [] },
    isLoading: false,
  }),
  useQueryEndpoint: () => ({
    query: { data: { items: [], totalCount: 0 }, isLoading: false, isFetching: false },
    params: { page: 1, pageSize: 25, sort: [] },
    isGrouped: false,
    setPage: vi.fn(),
    setPageSize: vi.fn(),
    toggleSort: vi.fn(),
  }),
  useSmartFilter: () => ({
    filters: [],
    search: '',
    presets: {},
    quickFilters: [],
    tokens: [],
    setSearch: vi.fn(),
    addFilter: vi.fn(),
    removeFilter: vi.fn(),
    clearFilters: vi.fn(),
    removeToken: vi.fn(),
  }),
}));

// The list page reads `useOperatorLabels` / `useSmartFilterSync` from admin-kit
// (cross-cutting helpers). Keep the real grid components, stub only the hooks.
vi.mock('@granit/react-ui-kit', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useOperatorLabels: () => ({}),
    useSmartFilterSync: () => ({ handlePresetToggle: vi.fn() }),
  };
});

describe('CatalogListPage', () => {
  it('renders the title', () => {
    renderWithProviders(<CatalogListPage />);
    expect(screen.getByText('Catalog')).toBeInTheDocument();
  });

  it('exposes the data-slot anchor', () => {
    renderWithProviders(<CatalogListPage />);
    expect(document.querySelector('[data-slot="catalog-list-page"]')).toBeInTheDocument();
  });

  it('renders the create-product button', () => {
    renderWithProviders(<CatalogListPage />);
    expect(screen.getByText('Create product')).toBeInTheDocument();
  });
});
