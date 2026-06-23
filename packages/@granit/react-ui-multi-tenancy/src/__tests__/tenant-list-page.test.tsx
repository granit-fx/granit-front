import { screen } from '@testing-library/react';

import { TenantListPage } from '../tenant-list-page';

import { renderWithProviders } from './test-utils';

import type { ReactNode } from 'react';

vi.mock('@granit/react-authorization', () => ({
  usePermissions: () => ({ hasPermission: () => true, isLoading: false }),
}));

vi.mock('@granit/react-multi-tenancy', () => ({
  TenantAdminProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
  useActivateTenant: () => ({ mutate: vi.fn(), isPending: false }),
  useDeactivateTenant: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock('@granit/react-data-exchange', () => ({
  DataExchangeProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
  useExportJob: () => ({ mutate: vi.fn(), isPending: false }),
  useExportDefinitions: () => ({ data: [], isLoading: false }),
  ExportProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock('@granit/react-ui-data-exchange', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  ExportDialog: () => null,
  ExportButton: () => null,
}));

vi.mock('@granit/react-query-engine', () => ({
  QueryProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
  useQueryMeta: () => ({ data: null, isLoading: false }),
  useQueryEndpoint: () => ({
    query: { data: { items: [], totalCount: 0 }, isLoading: false },
    groupedQuery: { data: null, isLoading: false },
    params: { page: 1, pageSize: 20, sort: [], groupBy: undefined, presets: {} },
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
    togglePreset: vi.fn(),
    removeToken: vi.fn(),
  }),
}));

vi.mock('@granit/react-ui-admin-kit', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useSmartFilterSync: () => ({ handlePresetToggle: vi.fn() }),
  useOperatorLabels: () => ({}),
}));

vi.mock('@granit/react-localization', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useDateFormatter: () => ({
      formatDate: (d: string) => d,
      formatDateTime: (d: string) => d,
      formatTimeAgo: (d: string) => d,
    }),
  };
});

describe('TenantListPage', () => {
  it('renders the page title', () => {
    renderWithProviders(<TenantListPage />);
    expect(screen.getByText('Tenants')).toBeInTheDocument();
  });

  it('renders the page subtitle', () => {
    renderWithProviders(<TenantListPage />);
    expect(screen.getByText('Manage tenants')).toBeInTheDocument();
  });

  it('has the correct data-slot', () => {
    renderWithProviders(<TenantListPage />);
    expect(document.querySelector('[data-slot="tenant-list-page"]')).toBeInTheDocument();
  });
});
