import { screen, waitFor } from '@testing-library/react';

import { TenantCreatePage } from '../tenant-create-page';

import { renderWithProviders } from './test-utils';

import type { ReactNode } from 'react';

const { mockCreate, mockNavigate, mockToastSuccess } = vi.hoisted(() => ({
  mockCreate: vi.fn(),
  mockNavigate: vi.fn(),
  mockToastSuccess: vi.fn(),
}));

vi.mock('@granit/react-multi-tenancy', () => ({
  TenantAdminProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
  useCreateTenant: () => ({ mutate: mockCreate, isPending: false }),
  useActivateTenant: () => ({ mutate: vi.fn(), isPending: false }),
  useDeactivateTenant: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('sonner', () => ({ toast: { success: mockToastSuccess } }));

afterEach(() => vi.clearAllMocks());

describe('TenantCreatePage', () => {
  it('renders the create title', () => {
    renderWithProviders(<TenantCreatePage />);
    expect(screen.getByText('Create Tenant')).toBeInTheDocument();
  });

  it('renders the back link to the tenant list', () => {
    renderWithProviders(<TenantCreatePage />);
    expect(screen.getByText('Tenants')).toBeInTheDocument();
  });

  it('has the correct data-slot', () => {
    renderWithProviders(<TenantCreatePage />);
    expect(document.querySelector('[data-slot="tenant-create-page"]')).toBeInTheDocument();
  });

  it('renders the Name field', () => {
    renderWithProviders(<TenantCreatePage />);
    expect(screen.getByText('Name')).toBeInTheDocument();
  });

  it('renders the Identifier field', () => {
    renderWithProviders(<TenantCreatePage />);
    expect(screen.getByText('Identifier')).toBeInTheDocument();
  });

  it('submits the form and navigates on success', async () => {
    mockCreate.mockImplementation((_values, opts) => opts.onSuccess?.());
    const { user } = renderWithProviders(<TenantCreatePage />);
    await user.type(screen.getByRole('textbox', { name: 'Name' }), 'Acme Corp');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(mockCreate).toHaveBeenCalled());
    expect(mockCreate.mock.calls[0][0]).toMatchObject({
      name: 'Acme Corp',
      identifier: 'acme-corp',
      contactEmail: undefined,
      jurisdiction: undefined,
    });
    expect(mockToastSuccess).toHaveBeenCalledWith('Tenant created successfully');
    expect(mockNavigate).toHaveBeenCalledWith('/tenants');
  });

  it('navigates back when cancelling', async () => {
    const { user } = renderWithProviders(<TenantCreatePage />);
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(mockNavigate).toHaveBeenCalledWith('/tenants');
  });
});
