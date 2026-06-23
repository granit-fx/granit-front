import { screen } from '@testing-library/react';

import { TenantCreatePage } from '../tenant-create-page';

import { renderWithProviders } from './test-utils';

import type { ReactNode } from 'react';

vi.mock('@granit/react-multi-tenancy', () => ({
  TenantAdminProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
  useCreateTenant: () => ({ mutate: vi.fn(), isPending: false }),
  useActivateTenant: () => ({ mutate: vi.fn(), isPending: false }),
  useDeactivateTenant: () => ({ mutate: vi.fn(), isPending: false }),
}));

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
});
