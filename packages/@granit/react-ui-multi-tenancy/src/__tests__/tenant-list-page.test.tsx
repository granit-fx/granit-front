import { mockTenants } from '@granit/react-multi-tenancy/testing';
import { screen, waitFor, within } from '@testing-library/react';

import { TenantListPage } from '../tenant-list-page';

import { renderWithProviders } from './test-utils';

import type { TenantQueryItem } from '../components/types';
import type { ReactNode } from 'react';

const { mockActivate, mockDeactivate, mockNavigate, mockToastSuccess, mockHasPermission } =
  vi.hoisted(() => ({
    mockActivate: vi.fn(),
    mockDeactivate: vi.fn(),
    mockNavigate: vi.fn(),
    mockToastSuccess: vi.fn(),
    mockHasPermission: vi.fn(() => true),
  }));

const { mockUseQueryMeta, mockUseQueryEndpoint } = vi.hoisted(() => ({
  mockUseQueryMeta: vi.fn(),
  mockUseQueryEndpoint: vi.fn(),
}));

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('sonner', () => ({ toast: { success: mockToastSuccess } }));

vi.mock('@granit/react-authorization', () => ({
  usePermissions: () => ({ hasPermission: mockHasPermission, isLoading: false }),
}));

vi.mock('@granit/react-multi-tenancy', () => ({
  TenantAdminProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
  useActivateTenant: () => ({ mutate: mockActivate, isPending: false }),
  useDeactivateTenant: () => ({ mutate: mockDeactivate, isPending: false }),
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
  ExportButton: ({ onExport, label }: { onExport: () => void; label: string }) => (
    <button type="button" onClick={onExport}>
      {label}
    </button>
  ),
}));

vi.mock('@granit/react-query-engine', () => ({
  QueryProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
  useQueryMeta: () => mockUseQueryMeta(),
  useQueryEndpoint: () => mockUseQueryEndpoint(),
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

const tenant: TenantQueryItem = mockTenants[0];

const META_DATA = {
  columns: [{ field: 'name', label: 'Name' }],
  presetFilterGroups: [],
  groupByFields: [],
};

function endpointWith(items: TenantQueryItem[]) {
  return {
    query: { data: { items, totalCount: items.length }, isLoading: false },
    groupedQuery: { data: null, isLoading: false },
    params: { page: 1, pageSize: 20, sort: [], groupBy: undefined, presets: {}, filters: [] },
    isGrouped: false,
    setPage: vi.fn(),
    setPageSize: vi.fn(),
    toggleSort: vi.fn(),
    setGroupBy: vi.fn(),
  };
}

beforeEach(() => {
  mockHasPermission.mockReturnValue(true);
  mockUseQueryMeta.mockReturnValue({ data: META_DATA, isLoading: false });
  mockUseQueryEndpoint.mockReturnValue(endpointWith([tenant]));
});

afterEach(() => vi.clearAllMocks());

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

  it('shows a spinner while metadata is loading', () => {
    mockUseQueryMeta.mockReturnValue({ data: null, isLoading: true });
    renderWithProviders(<TenantListPage />);
    expect(document.querySelector('[data-slot="tenant-list-page"]')).not.toBeInTheDocument();
  });

  it('renders the create button when the user can create', () => {
    renderWithProviders(<TenantListPage />);
    expect(screen.getByText('Create Tenant')).toBeInTheDocument();
  });

  it('hides the create button when the user cannot create', () => {
    mockHasPermission.mockImplementation((p: string) => p !== 'MultiTenancy.Tenants.Create');
    renderWithProviders(<TenantListPage />);
    expect(screen.queryByText('Create Tenant')).not.toBeInTheDocument();
  });

  it('renders a tenant row from the query data', () => {
    renderWithProviders(<TenantListPage />);
    expect(screen.getByText('Acme Corporation')).toBeInTheDocument();
  });

  it('navigates to the edit page from the row actions menu', async () => {
    const { user } = renderWithProviders(<TenantListPage />);
    const row = screen.getByText('Acme Corporation').closest('tr');
    await user.click(within(row as HTMLElement).getByRole('button'));
    await user.click(await screen.findByText('Edit'));
    expect(mockNavigate).toHaveBeenCalledWith(`/tenants/${tenant.id}/edit`);
  });

  it('deactivates a tenant through the status dialog', async () => {
    mockDeactivate.mockImplementation((_id, opts) => opts.onSuccess?.());
    const { user } = renderWithProviders(<TenantListPage />);
    const row = screen.getByText('Acme Corporation').closest('tr');
    await user.click(within(row as HTMLElement).getByRole('button'));
    await user.click(await screen.findByText('Deactivate'));
    const dialog = await screen.findByRole('alertdialog');
    await user.click(within(dialog).getByRole('button', { name: 'Deactivate' }));
    await waitFor(() => expect(mockDeactivate).toHaveBeenCalled());
    expect(mockDeactivate.mock.calls[0][0]).toBe(tenant.id);
    expect(mockToastSuccess).toHaveBeenCalledWith('Tenant deactivated successfully');
  });

  it('activates an inactive tenant through the status dialog', async () => {
    mockActivate.mockImplementation((_id, opts) => opts.onSuccess?.());
    mockUseQueryEndpoint.mockReturnValue(endpointWith([{ ...tenant, activated: false }]));
    const { user } = renderWithProviders(<TenantListPage />);
    const row = screen.getByText('Acme Corporation').closest('tr');
    await user.click(within(row as HTMLElement).getByRole('button'));
    await user.click(await screen.findByText('Activate'));
    const dialog = await screen.findByRole('alertdialog');
    await user.click(within(dialog).getByRole('button', { name: 'Activate' }));
    await waitFor(() => expect(mockActivate).toHaveBeenCalled());
    expect(mockActivate.mock.calls[0][0]).toBe(tenant.id);
    expect(mockToastSuccess).toHaveBeenCalledWith('Tenant activated successfully');
  });

  it('opens the export dialog from the export button', async () => {
    const { user } = renderWithProviders(<TenantListPage />);
    await user.click(screen.getByText('Export'));
    expect(screen.getByText('Export')).toBeInTheDocument();
  });
});
