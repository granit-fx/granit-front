import { screen } from '@testing-library/react';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { TaxRatesPage } from '../tax-rates-page';

import { renderWithProviders } from './test-utils';

vi.mock('@granit/react-query-engine', () => ({
  QueryProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useQueryMeta: () => ({ data: null, isLoading: false }),
  useQueryEndpoint: () => ({
    query: { data: { items: [], totalCount: 0 }, isLoading: false },
    groupedQuery: { data: null, isLoading: false },
    params: { page: 1, pageSize: 25, sort: [], groupBy: undefined, presets: {} },
    isGrouped: false,
    setPage: vi.fn(),
    setPageSize: vi.fn(),
    toggleSort: vi.fn(),
    setGroupBy: vi.fn(),
    setFilters: vi.fn(),
    setSearch: vi.fn(),
    setPresets: vi.fn(),
    setQuickFilters: vi.fn(),
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
    togglePreset: vi.fn(),
    removeToken: vi.fn(),
  }),
}));

describe('TaxRatesPage', () => {
  it('renders the page title', () => {
    renderWithProviders(<TaxRatesPage />);
    expect(screen.getByText('Tax Rates')).toBeInTheDocument();
  });

  it('renders the page subtitle', () => {
    renderWithProviders(<TaxRatesPage />);
    expect(screen.getByText('Manage tax rates')).toBeInTheDocument();
  });

  it('has the correct data-slot', () => {
    renderWithProviders(<TaxRatesPage />);
    expect(document.querySelector('[data-slot="tax-rates-page"]')).toBeInTheDocument();
  });
});
