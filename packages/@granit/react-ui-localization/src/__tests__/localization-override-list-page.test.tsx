import { screen, waitFor } from '@testing-library/react';

import { LocalizationOverrideListPage } from '../localization-override-list-page';

import { renderWithProviders } from './test-utils';

// Mock @granit/query-engine — provide minimal implementations
const mockQueryData = {
  items: [
    {
      id: '1',
      resourceName: 'Showcase',
      cultureName: 'fr',
      key: 'common.save',
      value: 'Sauvegarder',
      createdAt: '2026-01-01T00:00:00Z',
      createdBy: 'admin@granit-showcase.dev',
      modifiedAt: '2026-01-01T00:00:00Z',
      modifiedBy: 'admin@granit-showcase.dev',
    },
  ],
  totalCount: 1,
};

const mockMeta = {
  columns: [
    {
      name: 'resourceName',
      label: 'Module',
      type: 'String',
      order: 1,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'key',
      label: 'Key',
      type: 'String',
      order: 2,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'value',
      label: 'Value',
      type: 'String',
      order: 3,
      isSortable: false,
      isFilterable: true,
      isVisible: true,
    },
  ],
  filterableFields: [],
  sortableFields: [{ name: 'key' }],
  presetFilterGroups: [],
  quickFilters: [],
  dateFilters: [],
  groupByFields: [],
  pagination: { defaultPageSize: 20, maxPageSize: 100, supportsCursor: false },
};

vi.mock('@granit/react-query-engine', () => ({
  QueryProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useQueryMeta: () => ({ data: mockMeta, isLoading: false }),
  useQueryEndpoint: () => ({
    query: { data: mockQueryData, isLoading: false },
    groupedQuery: { data: undefined, isLoading: false },
    params: { page: 1, pageSize: 20, sort: [], filters: [], search: '' },
    isGrouped: false,
    setPage: vi.fn(),
    setPageSize: vi.fn(),
    toggleSort: vi.fn(),
    setFilters: vi.fn(),
    setSearch: vi.fn(),
    setPresets: vi.fn(),
    setQuickFilters: vi.fn(),
    setGroupBy: vi.fn(),
  }),
  useSmartFilter: () => ({
    filters: [],
    search: '',
    presets: {},
    quickFilters: [],
    tokens: [],
    addPresetToken: vi.fn(),
    removeToken: vi.fn(),
  }),
}));

vi.mock('@granit/react-data-exchange', () => ({
  DataExchangeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@granit/react-ui-data-exchange', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  ExportDialog: () => <div data-testid="export-dialog" />,
  ImportDialog: () => <div data-testid="import-dialog" />,
}));

describe('LocalizationOverrideListPage', () => {
  it('should render page title', () => {
    renderWithProviders(<LocalizationOverrideListPage />);
    expect(screen.getByText('Localization Management')).toBeInTheDocument();
  });

  it('should render subtitle', () => {
    renderWithProviders(<LocalizationOverrideListPage />);
    expect(screen.getByText(/translation overrides by module and language/i)).toBeInTheDocument();
  });

  it('should render the data table with overrides', async () => {
    renderWithProviders(<LocalizationOverrideListPage />);
    await waitFor(() => {
      expect(screen.getByText('common.save')).toBeInTheDocument();
    });
  });

  it('should render the override value', async () => {
    renderWithProviders(<LocalizationOverrideListPage />);
    await waitFor(() => {
      expect(screen.getByText('Sauvegarder')).toBeInTheDocument();
    });
  });

  it('should render module badge', async () => {
    renderWithProviders(<LocalizationOverrideListPage />);
    await waitFor(() => {
      expect(screen.getByText('Showcase')).toBeInTheDocument();
    });
  });

  it('should render the data-slot attribute', () => {
    renderWithProviders(<LocalizationOverrideListPage />);
    expect(
      document.querySelector('[data-slot="localization-override-list-page"]')
    ).toBeInTheDocument();
  });
});
