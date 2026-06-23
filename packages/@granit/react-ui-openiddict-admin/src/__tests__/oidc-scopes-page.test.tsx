import { mockOidcScopes } from '@granit/react-openiddict-admin/testing';
import { screen, waitFor, within } from '@testing-library/react';

import { OidcScopesPage } from '../scopes/oidc-scopes-page';

import { renderWithProviders } from './test-utils';

import type { AdminOidcScopeResponse } from '@granit/openiddict-admin';

// A scope whose optional fields are all null/empty, to exercise the `?? '—'`
// row fallbacks and the null-coalescing branches in openEdit/handleEdit.
const nullScope: AdminOidcScopeResponse = {
  name: 'sparse',
  displayName: null,
  description: null,
  resources: null,
};

let scopesQuery: { data: readonly AdminOidcScopeResponse[]; isLoading: boolean } = {
  data: [],
  isLoading: false,
};
let canManage = true;

const createMutate = vi.fn();
const updateMutate = vi.fn();
const deleteMutate = vi.fn();
let pending = false;

vi.mock('@granit/react-openiddict-admin', () => ({
  useOidcScopes: () => scopesQuery,
  useCreateOidcScope: () => ({ mutateAsync: createMutate, isPending: pending }),
  useUpdateOidcScope: () => ({ mutateAsync: updateMutate, isPending: pending }),
  useDeleteOidcScope: () => ({ mutateAsync: deleteMutate, isPending: pending }),
}));

vi.mock('@granit/react-authorization', () => ({
  usePermissions: () => ({ hasPermission: () => canManage, isLoading: false }),
}));

const toastSuccess = vi.fn();
const toastError = vi.fn();
vi.mock('sonner', () => ({
  toast: {
    success: (msg: string) => toastSuccess(msg),
    error: (msg: string) => toastError(msg),
  },
}));

beforeEach(() => {
  scopesQuery = { data: [], isLoading: false };
  canManage = true;
  pending = false;
  createMutate.mockReset().mockResolvedValue(undefined);
  updateMutate.mockReset().mockResolvedValue(undefined);
  deleteMutate.mockReset().mockResolvedValue(undefined);
  toastSuccess.mockReset();
  toastError.mockReset();
});

describe('OidcScopesPage', () => {
  it('renders the page title and data-slot', () => {
    renderWithProviders(<OidcScopesPage />);
    expect(screen.getByRole('heading', { name: 'OIDC Scopes' })).toBeInTheDocument();
    expect(document.querySelector('[data-slot="oidc-scopes-page"]')).toBeInTheDocument();
  });

  it('shows the empty state when no scopes are registered', () => {
    renderWithProviders(<OidcScopesPage />);
    expect(screen.getByText('No scopes registered yet.')).toBeInTheDocument();
  });

  it('does not show the empty state while loading', () => {
    scopesQuery = { data: [], isLoading: true };
    renderWithProviders(<OidcScopesPage />);
    expect(screen.queryByText('No scopes registered yet.')).not.toBeInTheDocument();
  });

  it('renders a row per scope with edit and delete actions', () => {
    scopesQuery = { data: mockOidcScopes, isLoading: false };
    renderWithProviders(<OidcScopesPage />);
    expect(screen.getByText('OpenID')).toBeInTheDocument();
    expect(screen.getByText('Granit Admin')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /edit/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('button', { name: /delete/i }).length).toBeGreaterThan(0);
  });

  it('exposes the create action when the user can manage scopes', () => {
    renderWithProviders(<OidcScopesPage />);
    expect(screen.getByRole('button', { name: /create scope/i })).toBeInTheDocument();
  });

  it('hides the create action and row actions without the manage permission', () => {
    canManage = false;
    scopesQuery = { data: mockOidcScopes, isLoading: false };
    renderWithProviders(<OidcScopesPage />);
    expect(screen.queryByRole('button', { name: /create scope/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument();
  });

  it('creates a scope from the dialog and shows a success toast', async () => {
    const { user } = renderWithProviders(<OidcScopesPage />);
    await user.click(screen.getByRole('button', { name: /create scope/i }));

    const dialog = within(await screen.findByRole('dialog'));
    await user.type(dialog.getByLabelText('Name'), 'api:read');
    await user.type(dialog.getByLabelText('Display Name'), 'Read API');
    await user.type(dialog.getByLabelText('Description'), 'Reads the API');
    await user.type(dialog.getByLabelText('Resources'), 'api://one');

    await user.click(dialog.getByRole('button', { name: 'Create Scope' }));

    await waitFor(() => expect(createMutate).toHaveBeenCalledTimes(1));
    expect(createMutate).toHaveBeenCalledWith({
      name: 'api:read',
      displayName: 'Read API',
      description: 'Reads the API',
      resources: ['api://one'],
    });
    expect(toastSuccess).toHaveBeenCalledWith('Scope created successfully');
  });

  it('shows an error toast when scope creation fails', async () => {
    createMutate.mockRejectedValue(new Error('boom'));
    const { user } = renderWithProviders(<OidcScopesPage />);
    await user.click(screen.getByRole('button', { name: /create scope/i }));

    const dialog = within(await screen.findByRole('dialog'));
    await user.type(dialog.getByLabelText('Name'), 'api:read');
    await user.click(dialog.getByRole('button', { name: 'Create Scope' }));

    await waitFor(() => expect(toastError).toHaveBeenCalledWith('Failed to create scope'));
  });

  it('closes the create dialog on cancel without calling the mutation', async () => {
    const { user } = renderWithProviders(<OidcScopesPage />);
    await user.click(screen.getByRole('button', { name: /create scope/i }));
    const dialog = within(await screen.findByRole('dialog'));
    await user.click(dialog.getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(createMutate).not.toHaveBeenCalled();
  });

  it('edits a scope and shows a success toast', async () => {
    scopesQuery = { data: mockOidcScopes, isLoading: false };
    const { user } = renderWithProviders(<OidcScopesPage />);
    await user.click(screen.getAllByRole('button', { name: /edit/i })[0]!);

    const dialog = within(await screen.findByRole('dialog'));
    expect(dialog.getByText('Edit Scope')).toBeInTheDocument();
    const displayName = dialog.getByLabelText('Display Name');
    await user.clear(displayName);
    await user.type(displayName, 'OpenID Connect');
    await user.click(dialog.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(updateMutate).toHaveBeenCalledTimes(1));
    expect(updateMutate.mock.calls[0]![0]).toMatchObject({
      scopeName: 'openid',
      request: { displayName: 'OpenID Connect' },
    });
    expect(toastSuccess).toHaveBeenCalledWith('Scope updated successfully');
  });

  it('edits a scope description and resources', async () => {
    scopesQuery = { data: mockOidcScopes, isLoading: false };
    const { user } = renderWithProviders(<OidcScopesPage />);
    // edit the scope that already has resources (granit:admin, index 3)
    await user.click(screen.getAllByRole('button', { name: /edit/i })[3]!);

    const dialog = within(await screen.findByRole('dialog'));
    const description = dialog.getByLabelText('Description');
    await user.clear(description);
    await user.type(description, 'Updated description');

    const resources = dialog.getByLabelText('Resources');
    await user.clear(resources);
    await user.type(resources, 'api://new-resource');

    await user.click(dialog.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(updateMutate).toHaveBeenCalledTimes(1));
    expect(updateMutate.mock.calls[0]![0]).toMatchObject({
      scopeName: 'granit:admin',
      request: {
        description: 'Updated description',
        resources: ['api://new-resource'],
      },
    });
  });

  it('renders fallback dashes for a scope with no optional fields', () => {
    scopesQuery = { data: [nullScope], isLoading: false };
    renderWithProviders(<OidcScopesPage />);
    expect(screen.getByText('sparse')).toBeInTheDocument();
    // displayName / description / resources all render an em dash
    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(3);
  });

  it('edits a sparse scope, clearing display name to null', async () => {
    scopesQuery = { data: [nullScope], isLoading: false };
    const { user } = renderWithProviders(<OidcScopesPage />);
    await user.click(screen.getByRole('button', { name: /edit/i }));

    const dialog = within(await screen.findByRole('dialog'));
    // fields start empty (null coalesced to ''); leave them empty and save
    await user.click(dialog.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(updateMutate).toHaveBeenCalledTimes(1));
    expect(updateMutate.mock.calls[0]![0]).toMatchObject({
      scopeName: 'sparse',
      request: { displayName: null, description: null },
    });
  });

  it('shows spinners and disables actions on every dialog while pending', async () => {
    pending = true;
    scopesQuery = { data: mockOidcScopes, isLoading: false };
    const { user } = renderWithProviders(<OidcScopesPage />);

    await user.click(screen.getByRole('button', { name: /create scope/i }));
    let dialog = within(await screen.findByRole('dialog'));
    expect(dialog.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    expect(dialog.getByRole('button', { name: 'Create Scope' })).toBeDisabled();
    await user.keyboard('{Escape}');

    await user.click(screen.getAllByRole('button', { name: /^edit/i })[0]!);
    dialog = within(await screen.findByRole('dialog'));
    expect(dialog.getByRole('button', { name: 'Save' })).toBeDisabled();
    await user.keyboard('{Escape}');

    await user.click(screen.getAllByRole('button', { name: /^delete/i })[0]!);
    dialog = within(await screen.findByRole('dialog'));
    expect(dialog.getByRole('button', { name: 'Delete' })).toBeDisabled();
  });

  it('creates a scope with no optional fields, sending undefined resources', async () => {
    const { user } = renderWithProviders(<OidcScopesPage />);
    await user.click(screen.getByRole('button', { name: /create scope/i }));
    const dialog = within(await screen.findByRole('dialog'));
    await user.type(dialog.getByLabelText('Name'), 'minimal');
    await user.click(dialog.getByRole('button', { name: 'Create Scope' }));
    await waitFor(() => expect(createMutate).toHaveBeenCalledTimes(1));
    expect(createMutate).toHaveBeenCalledWith({
      name: 'minimal',
      displayName: undefined,
      description: undefined,
      resources: undefined,
    });
  });

  it('shows a not-found toast when editing returns 404', async () => {
    updateMutate.mockRejectedValue({ response: { status: 404 } });
    scopesQuery = { data: mockOidcScopes, isLoading: false };
    const { user } = renderWithProviders(<OidcScopesPage />);
    await user.click(screen.getAllByRole('button', { name: /edit/i })[0]!);
    const dialog = within(await screen.findByRole('dialog'));
    await user.click(dialog.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(toastError).toHaveBeenCalledWith('Scope not found'));
  });

  it('shows a generic error toast on a non-404 edit failure', async () => {
    updateMutate.mockRejectedValue({ response: { status: 500 } });
    scopesQuery = { data: mockOidcScopes, isLoading: false };
    const { user } = renderWithProviders(<OidcScopesPage />);
    await user.click(screen.getAllByRole('button', { name: /edit/i })[0]!);
    const dialog = within(await screen.findByRole('dialog'));
    await user.click(dialog.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(toastError).toHaveBeenCalledWith('Failed to update scope'));
  });

  it('deletes a scope and shows a success toast', async () => {
    scopesQuery = { data: mockOidcScopes, isLoading: false };
    const { user } = renderWithProviders(<OidcScopesPage />);
    await user.click(screen.getAllByRole('button', { name: /delete/i })[0]!);

    const dialog = within(await screen.findByRole('dialog'));
    expect(dialog.getByText('Delete Scope')).toBeInTheDocument();
    await user.click(dialog.getByRole('button', { name: 'Delete' }));

    await waitFor(() => expect(deleteMutate).toHaveBeenCalledWith('openid'));
    expect(toastSuccess).toHaveBeenCalledWith('Scope deleted successfully');
  });

  it('shows an error toast when deletion fails', async () => {
    deleteMutate.mockRejectedValue(new Error('boom'));
    scopesQuery = { data: mockOidcScopes, isLoading: false };
    const { user } = renderWithProviders(<OidcScopesPage />);
    await user.click(screen.getAllByRole('button', { name: /delete/i })[0]!);
    const dialog = within(await screen.findByRole('dialog'));
    await user.click(dialog.getByRole('button', { name: 'Delete' }));
    await waitFor(() => expect(toastError).toHaveBeenCalledWith('Failed to delete scope'));
  });
});
