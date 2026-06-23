import { screen } from '@testing-library/react';
import * as React from 'react';

import { BlobListPage } from '../blob-list-page';

import { renderWithProviders } from './test-utils';

vi.mock('@granit/react-authorization', () => ({
  usePermissions: () => ({ hasPermission: () => true }),
}));

vi.mock('@granit/react-blob-storage', () => ({
  useDownloadUrl: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDeleteBlob: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useCleanupOrphans: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock('@granit/react-query-engine', () => ({
  QueryProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useQueryMeta: () => ({
    data: { columns: [], presetFilterGroups: [], groupByFields: [] },
    isLoading: false,
  }),
  useQueryEndpoint: () => ({
    query: {
      data: { items: [], totalCount: 0 },
      isLoading: false,
      isFetching: false,
      refetch: vi.fn(),
    },
    groupedQuery: { data: null, isLoading: false },
    params: { page: 1, pageSize: 20, sort: [], groupBy: undefined },
    isGrouped: false,
    setPage: vi.fn(),
    setPageSize: vi.fn(),
    toggleSort: vi.fn(),
    setGroupBy: vi.fn(),
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

vi.mock('@granit/react-ui-admin-kit', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useSmartFilterSync: () => ({ handlePresetToggle: vi.fn() }),
  useOperatorLabels: () => ({}),
}));

describe('BlobListPage', () => {
  it('should render the page title', () => {
    renderWithProviders(<BlobListPage />);
    expect(screen.getByText('Blob Storage')).toBeInTheDocument();
  });

  it('should have data-slot attribute', () => {
    renderWithProviders(<BlobListPage />);
    expect(document.querySelector('[data-slot="blob-list-page"]')).toBeInTheDocument();
  });
});
