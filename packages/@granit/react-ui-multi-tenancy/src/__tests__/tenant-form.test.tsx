import { screen, waitFor } from '@testing-library/react';

import { TenantForm } from '../components/tenant-form';

import { renderWithProviders } from './test-utils';

describe('TenantForm (create mode)', () => {
  it('renders the create fields', () => {
    renderWithProviders(
      <TenantForm mode="create" onSubmit={vi.fn()} onCancel={vi.fn()} isSubmitting={false} />
    );
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Identifier')).toBeInTheDocument();
  });

  it('auto-derives the identifier slug from the name until it is edited', async () => {
    const { user } = renderWithProviders(
      <TenantForm mode="create" onSubmit={vi.fn()} onCancel={vi.fn()} isSubmitting={false} />
    );
    const nameInput = screen.getByRole('textbox', { name: 'Name' });
    await user.type(nameInput, 'Acme Corp');
    const identifierInput = screen.getByRole('textbox', { name: 'Identifier' });
    await waitFor(() => expect(identifierInput).toHaveValue('acme-corp'));
  });

  it('stops auto-deriving once the identifier is edited manually', async () => {
    const { user } = renderWithProviders(
      <TenantForm mode="create" onSubmit={vi.fn()} onCancel={vi.fn()} isSubmitting={false} />
    );
    const identifierInput = screen.getByRole('textbox', { name: 'Identifier' });
    await user.type(identifierInput, 'custom-id');
    const nameInput = screen.getByRole('textbox', { name: 'Name' });
    await user.type(nameInput, 'Acme Corp');
    expect(identifierInput).toHaveValue('custom-id');
  });

  it('submits the create values', async () => {
    const onSubmit = vi.fn();
    const { user } = renderWithProviders(
      <TenantForm mode="create" onSubmit={onSubmit} onCancel={vi.fn()} isSubmitting={false} />
    );
    await user.type(screen.getByRole('textbox', { name: 'Name' }), 'Acme Corp');
    await user.type(screen.getByRole('textbox', { name: 'Contact Email' }), 'a@b.com');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onSubmit.mock.calls[0][0]).toMatchObject({
      name: 'Acme Corp',
      identifier: 'acme-corp',
      contactEmail: 'a@b.com',
    });
  });

  it('shows the loading label while submitting', () => {
    renderWithProviders(
      <TenantForm mode="create" onSubmit={vi.fn()} onCancel={vi.fn()} isSubmitting={true} />
    );
    expect(screen.getByRole('button', { name: 'Loading...' })).toBeDisabled();
  });

  it('invokes onCancel from the cancel button', async () => {
    const onCancel = vi.fn();
    const { user } = renderWithProviders(
      <TenantForm mode="create" onSubmit={vi.fn()} onCancel={onCancel} isSubmitting={false} />
    );
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalled();
  });
});

describe('TenantForm (edit mode)', () => {
  const defaultValues = { name: 'Acme', contactEmail: 'a@b.com', jurisdiction: 'BE' };

  it('renders the read-only identifier and pre-fills values', () => {
    renderWithProviders(
      <TenantForm
        mode="edit"
        defaultValues={defaultValues}
        readOnlyIdentifier="acme"
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
        isSubmitting={false}
      />
    );
    const identifier = screen.getByDisplayValue('acme');
    expect(identifier).toBeDisabled();
    expect(screen.getByDisplayValue('Acme')).toBeInTheDocument();
    expect(screen.getByText('Identifier cannot be changed')).toBeInTheDocument();
  });

  it('submits the edit values', async () => {
    const onSubmit = vi.fn();
    const { user } = renderWithProviders(
      <TenantForm
        mode="edit"
        defaultValues={defaultValues}
        readOnlyIdentifier="acme"
        onSubmit={onSubmit}
        onCancel={vi.fn()}
        isSubmitting={false}
      />
    );
    const nameInput = screen.getByRole('textbox', { name: 'Name' });
    await user.clear(nameInput);
    await user.type(nameInput, 'Acme Inc');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onSubmit.mock.calls[0][0]).toMatchObject({ name: 'Acme Inc' });
  });
});
