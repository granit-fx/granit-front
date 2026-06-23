import { screen } from '@testing-library/react';

import { TenantStatusDialog } from '../components/tenant-status-dialog';

import { renderWithProviders } from './test-utils';

describe('TenantStatusDialog', () => {
  it('renders nothing visible when closed', () => {
    renderWithProviders(
      <TenantStatusDialog
        tenantName="Acme"
        action="deactivate"
        open={false}
        onOpenChange={vi.fn()}
        onConfirm={vi.fn()}
        isPending={false}
      />
    );
    expect(screen.queryByText('Deactivate Tenant')).not.toBeInTheDocument();
  });

  it('renders the deactivate title and action label', () => {
    renderWithProviders(
      <TenantStatusDialog
        tenantName="Acme"
        action="deactivate"
        open
        onOpenChange={vi.fn()}
        onConfirm={vi.fn()}
        isPending={false}
      />
    );
    expect(screen.getByText('Deactivate Tenant')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Deactivate' })).toBeInTheDocument();
  });

  it('renders the activate title and action label', () => {
    renderWithProviders(
      <TenantStatusDialog
        tenantName="Acme"
        action="activate"
        open
        onOpenChange={vi.fn()}
        onConfirm={vi.fn()}
        isPending={false}
      />
    );
    expect(screen.getByText('Activate Tenant')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Activate' })).toBeInTheDocument();
  });

  it('shows the loading label and disables the action while pending', () => {
    renderWithProviders(
      <TenantStatusDialog
        tenantName="Acme"
        action="activate"
        open
        onOpenChange={vi.fn()}
        onConfirm={vi.fn()}
        isPending
      />
    );
    expect(screen.getByRole('button', { name: 'Loading...' })).toBeDisabled();
  });

  it('invokes onConfirm when the action button is clicked', async () => {
    const onConfirm = vi.fn();
    const { user } = renderWithProviders(
      <TenantStatusDialog
        tenantName="Acme"
        action="deactivate"
        open
        onOpenChange={vi.fn()}
        onConfirm={onConfirm}
        isPending={false}
      />
    );
    await user.click(screen.getByRole('button', { name: 'Deactivate' }));
    expect(onConfirm).toHaveBeenCalled();
  });
});
