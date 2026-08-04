import { mockTenants } from '@granit/react-multi-tenancy/testing';
import { screen, waitFor, within } from '@testing-library/react';

import { TenantEditPage } from '../tenant-edit-page';

import { renderWithProviders } from './test-utils';

const { mockUseParams, mockNavigate } = vi.hoisted(() => ({
  mockUseParams: vi.fn(),
  mockNavigate: vi.fn(),
}));

vi.mock('react-router', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return { ...actual, useParams: mockUseParams, useNavigate: () => mockNavigate };
});

const { mockUseTenantDetail, mockUpdate, mockActivate, mockDeactivate } = vi.hoisted(() => ({
  mockUseTenantDetail: vi.fn(),
  mockUpdate: vi.fn(),
  mockActivate: vi.fn(),
  mockDeactivate: vi.fn(),
}));

vi.mock('@granit/react-multi-tenancy', () => ({
  TenantAdminProvider: ({ children }: { children: React.ReactNode }) => children,
  useTenantDetail: () => mockUseTenantDetail(),
  useUpdateTenant: () => ({ mutate: mockUpdate, isPending: false }),
  useActivateTenant: () => ({ mutate: mockActivate, isPending: false }),
  useDeactivateTenant: () => ({ mutate: mockDeactivate, isPending: false }),
}));

const { mockHasPermission, mockToastSuccess } = vi.hoisted(() => ({
  mockHasPermission: vi.fn(),
  mockToastSuccess: vi.fn(),
}));

vi.mock('@granit/react-authorization', () => ({
  usePermissions: () => ({ hasPermission: mockHasPermission, isLoading: false }),
}));

vi.mock('sonner', () => ({ toast: { success: mockToastSuccess } }));

const mockTenant = mockTenants[0];

describe('TenantEditPage', () => {
  beforeEach(() => {
    mockUseParams.mockReturnValue({ id: 'tnt_01HZ9KQX0000000000001' });
    mockHasPermission.mockReturnValue(true);
  });

  afterEach(() => vi.clearAllMocks());

  it('should show the loading spinner', () => {
    mockUseTenantDetail.mockReturnValue({ data: undefined, isLoading: true });
    renderWithProviders(<TenantEditPage />, {
      route: '/tenants/tnt_01HZ9KQX0000000000001/edit',
    });
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('should show the not-found state when the tenant is missing', () => {
    mockUseTenantDetail.mockReturnValue({ data: undefined, isLoading: false });
    renderWithProviders(<TenantEditPage />, {
      route: '/tenants/tnt_01HZ9KQX0000000000001/edit',
    });
    expect(screen.getByText('Tenant not found')).toBeInTheDocument();
  });

  it('should render the tenant name and active status badge', () => {
    mockUseTenantDetail.mockReturnValue({ data: mockTenant, isLoading: false });
    renderWithProviders(<TenantEditPage />, {
      route: '/tenants/tnt_01HZ9KQX0000000000001/edit',
    });
    expect(screen.getByText('Acme Corporation')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('should render the inactive badge and Activate button for a deactivated tenant', () => {
    mockUseTenantDetail.mockReturnValue({
      data: { ...mockTenant, activated: false },
      isLoading: false,
    });
    renderWithProviders(<TenantEditPage />, {
      route: '/tenants/tnt_01HZ9KQX0000000000001/edit',
    });
    expect(screen.getByText('Inactive')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Activate' })).toBeInTheDocument();
  });

  it('should have the page data-slot', () => {
    mockUseTenantDetail.mockReturnValue({ data: mockTenant, isLoading: false });
    renderWithProviders(<TenantEditPage />, {
      route: '/tenants/tnt_01HZ9KQX0000000000001/edit',
    });
    expect(document.querySelector('[data-slot="tenant-edit-page"]')).toBeInTheDocument();
  });

  it('should pre-fill the edit form with the tenant values', async () => {
    mockUseTenantDetail.mockReturnValue({ data: mockTenant, isLoading: false });
    renderWithProviders(<TenantEditPage />, {
      route: '/tenants/tnt_01HZ9KQX0000000000001/edit',
    });
    await waitFor(() => {
      expect(screen.getByDisplayValue('Acme Corporation')).toBeInTheDocument();
    });
    expect(screen.getByDisplayValue('admin@acme.example')).toBeInTheDocument();
  });

  it('should render the deactivate button for an active tenant', () => {
    mockUseTenantDetail.mockReturnValue({ data: mockTenant, isLoading: false });
    renderWithProviders(<TenantEditPage />, {
      route: '/tenants/tnt_01HZ9KQX0000000000001/edit',
    });
    expect(screen.getByText('Deactivate')).toBeInTheDocument();
  });

  it('should render the custom-domains link when the user can read hostnames', () => {
    mockUseTenantDetail.mockReturnValue({ data: mockTenant, isLoading: false });
    renderWithProviders(<TenantEditPage />, {
      route: '/tenants/tnt_01HZ9KQX0000000000001/edit',
    });
    expect(screen.getByText('Custom Domains')).toBeInTheDocument();
  });

  it('should hide manage controls when the user lacks permissions', () => {
    mockHasPermission.mockReturnValue(false);
    mockUseTenantDetail.mockReturnValue({ data: mockTenant, isLoading: false });
    renderWithProviders(<TenantEditPage />, {
      route: '/tenants/tnt_01HZ9KQX0000000000001/edit',
    });
    expect(screen.queryByText('Custom Domains')).not.toBeInTheDocument();
    expect(screen.queryByText('Deactivate')).not.toBeInTheDocument();
  });

  it('should render the activity aside via the renderActivityAside slot', () => {
    mockUseTenantDetail.mockReturnValue({ data: mockTenant, isLoading: false });
    renderWithProviders(
      <TenantEditPage renderActivityAside={() => <div data-testid="activity-aside" />} />,
      { route: '/tenants/tnt_01HZ9KQX0000000000001/edit' }
    );
    expect(screen.getByTestId('activity-aside')).toBeInTheDocument();
  });

  it('should submit the update and navigate on success', async () => {
    mockUpdate.mockImplementation((_args, opts) => opts.onSuccess?.());
    mockUseTenantDetail.mockReturnValue({ data: mockTenant, isLoading: false });
    const { user } = renderWithProviders(<TenantEditPage />, {
      route: '/tenants/tnt_01HZ9KQX0000000000001/edit',
    });
    const nameInput = await screen.findByDisplayValue('Acme Corporation');
    await user.clear(nameInput);
    await user.type(nameInput, 'Acme Inc');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(mockUpdate).toHaveBeenCalled());
    expect(mockUpdate.mock.calls[0][0]).toMatchObject({
      id: 'tnt_01HZ9KQX0000000000001',
      request: { name: 'Acme Inc', concurrencyStamp: 'stamp-acme-0001' },
    });
    expect(mockToastSuccess).toHaveBeenCalledWith('Tenant saved successfully');
    expect(mockNavigate).toHaveBeenCalledWith('/tenants');
  });

  it('should deactivate the tenant via the status dialog', async () => {
    mockDeactivate.mockImplementation((_id, opts) => opts.onSuccess?.());
    mockUseTenantDetail.mockReturnValue({ data: mockTenant, isLoading: false });
    const { user } = renderWithProviders(<TenantEditPage />, {
      route: '/tenants/tnt_01HZ9KQX0000000000001/edit',
    });
    await user.click(screen.getByRole('button', { name: 'Deactivate' }));
    const dialog = await screen.findByRole('alertdialog');
    await user.click(within(dialog).getByRole('button', { name: 'Deactivate' }));
    await waitFor(() => expect(mockDeactivate).toHaveBeenCalled());
    expect(mockDeactivate.mock.calls[0][0]).toBe('tnt_01HZ9KQX0000000000001');
    expect(mockToastSuccess).toHaveBeenCalledWith('Tenant deactivated successfully');
  });

  it('should activate an inactive tenant via the status dialog', async () => {
    mockActivate.mockImplementation((_id, opts) => opts.onSuccess?.());
    mockUseTenantDetail.mockReturnValue({
      data: { ...mockTenant, activated: false },
      isLoading: false,
    });
    const { user } = renderWithProviders(<TenantEditPage />, {
      route: '/tenants/tnt_01HZ9KQX0000000000001/edit',
    });
    await user.click(screen.getByRole('button', { name: 'Activate' }));
    const dialog = await screen.findByRole('alertdialog');
    await user.click(within(dialog).getByRole('button', { name: 'Activate' }));
    await waitFor(() => expect(mockActivate).toHaveBeenCalled());
    expect(mockActivate.mock.calls[0][0]).toBe('tnt_01HZ9KQX0000000000001');
    expect(mockToastSuccess).toHaveBeenCalledWith('Tenant activated successfully');
  });

  it('should navigate back when cancelling the form', async () => {
    mockUseTenantDetail.mockReturnValue({ data: mockTenant, isLoading: false });
    const { user } = renderWithProviders(<TenantEditPage />, {
      route: '/tenants/tnt_01HZ9KQX0000000000001/edit',
    });
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(mockNavigate).toHaveBeenCalledWith('/tenants');
  });
});
