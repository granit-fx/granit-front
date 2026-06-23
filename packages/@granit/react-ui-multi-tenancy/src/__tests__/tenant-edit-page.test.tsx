import { toISODateString } from '@granit/types';
import { screen, waitFor } from '@testing-library/react';

import { TenantEditPage } from '../tenant-edit-page';

import { renderWithProviders } from './test-utils';

import type { TenantResponse } from '@granit/multi-tenancy';

const { mockUseParams } = vi.hoisted(() => ({ mockUseParams: vi.fn() }));

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return { ...actual, useParams: mockUseParams };
});

const { mockUseTenantDetail } = vi.hoisted(() => ({ mockUseTenantDetail: vi.fn() }));

vi.mock('@granit/react-multi-tenancy', () => ({
  TenantAdminProvider: ({ children }: { children: React.ReactNode }) => children,
  useTenantDetail: () => mockUseTenantDetail(),
  useUpdateTenant: () => ({ mutate: vi.fn(), isPending: false }),
  useActivateTenant: () => ({ mutate: vi.fn(), isPending: false }),
  useDeactivateTenant: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock('@granit/react-authorization', () => ({
  usePermissions: () => ({ hasPermission: () => true, isLoading: false }),
}));

const mockTenant: TenantResponse = {
  id: 'tnt_01HZ9KQX0000000000001',
  name: 'Acme Corporation',
  identifier: 'acme',
  contactEmail: 'admin@acme.com',
  activated: true,
  jurisdiction: 'BE',
  createdAt: toISODateString('2026-01-01T00:00:00Z'),
  concurrencyStamp: 'stamp-1',
};

describe('TenantEditPage', () => {
  beforeEach(() => {
    mockUseParams.mockReturnValue({ id: 'tnt_01HZ9KQX0000000000001' });
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
    expect(screen.getByDisplayValue('admin@acme.com')).toBeInTheDocument();
  });

  it('should render the deactivate button for an active tenant', () => {
    mockUseTenantDetail.mockReturnValue({ data: mockTenant, isLoading: false });
    renderWithProviders(<TenantEditPage />, {
      route: '/tenants/tnt_01HZ9KQX0000000000001/edit',
    });
    expect(screen.getByText('Deactivate')).toBeInTheDocument();
  });

  it('should render the activity aside via the renderActivityAside slot', () => {
    mockUseTenantDetail.mockReturnValue({ data: mockTenant, isLoading: false });
    renderWithProviders(
      <TenantEditPage renderActivityAside={() => <div data-testid="activity-aside" />} />,
      { route: '/tenants/tnt_01HZ9KQX0000000000001/edit' }
    );
    expect(screen.getByTestId('activity-aside')).toBeInTheDocument();
  });
});
