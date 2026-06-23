import { mockOidcAuthorizations } from '@granit/react-openiddict-admin/testing';
import { screen, waitFor, within } from '@testing-library/react';

import { OidcAuthorizationsPage } from '../authorizations/oidc-authorizations-page';

import { renderWithProviders } from './test-utils';

import type { AdminOidcAuthorizationResponse } from '@granit/openiddict-admin';

let authQuery: { data: readonly AdminOidcAuthorizationResponse[]; isLoading: boolean } = {
  data: [],
  isLoading: false,
};
let granted = new Set<string>([
  'OpenIddict.Authorizations.Create',
  'OpenIddict.Authorizations.Revoke',
]);

const createMutate = vi.fn();
const revokeMutate = vi.fn();
const revokeUserMutate = vi.fn();
let pending = false;

vi.mock('@granit/react-openiddict-admin', () => ({
  useOidcAuthorizations: () => authQuery,
  useCreateOidcAuthorization: () => ({ mutateAsync: createMutate, isPending: pending }),
  useRevokeAuthorization: () => ({ mutateAsync: revokeMutate, isPending: pending }),
  useRevokeUserAuthorizations: () => ({ mutateAsync: revokeUserMutate, isPending: pending }),
}));

vi.mock('@granit/react-authorization', () => ({
  usePermissions: () => ({ hasPermission: (p: string) => granted.has(p), isLoading: false }),
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
  authQuery = { data: [], isLoading: false };
  granted = new Set<string>([
    'OpenIddict.Authorizations.Create',
    'OpenIddict.Authorizations.Revoke',
  ]);
  pending = false;
  createMutate.mockReset().mockResolvedValue(undefined);
  revokeMutate.mockReset().mockResolvedValue(undefined);
  revokeUserMutate.mockReset().mockResolvedValue(undefined);
  toastSuccess.mockReset();
  toastError.mockReset();
});

describe('OidcAuthorizationsPage', () => {
  it('renders the page title and data-slot', () => {
    renderWithProviders(<OidcAuthorizationsPage />);
    expect(screen.getByRole('heading', { name: 'OIDC Authorizations' })).toBeInTheDocument();
    expect(document.querySelector('[data-slot="oidc-authorizations-page"]')).toBeInTheDocument();
  });

  it('shows the empty state when no authorizations exist', () => {
    renderWithProviders(<OidcAuthorizationsPage />);
    expect(screen.getByText('No authorizations found.')).toBeInTheDocument();
  });

  it('does not show the empty state while loading', () => {
    authQuery = { data: [], isLoading: true };
    renderWithProviders(<OidcAuthorizationsPage />);
    expect(screen.queryByText('No authorizations found.')).not.toBeInTheDocument();
  });

  it('renders a row per authorization with subject, client and scope chips', () => {
    authQuery = { data: mockOidcAuthorizations, isLoading: false };
    renderWithProviders(<OidcAuthorizationsPage />);
    expect(screen.getByText('usr_01HZ9KQX0000000000001')).toBeInTheDocument();
    expect(screen.getAllByText('granit-showcase-admin').length).toBeGreaterThan(0);
    // scope chips for the first row
    expect(screen.getAllByText('openid').length).toBeGreaterThan(0);
  });

  it('exposes the grant action with the create permission', () => {
    renderWithProviders(<OidcAuthorizationsPage />);
    expect(screen.getByRole('button', { name: /grant consent/i })).toBeInTheDocument();
  });

  it('hides the grant action without the create permission', () => {
    granted = new Set<string>(['OpenIddict.Authorizations.Revoke']);
    renderWithProviders(<OidcAuthorizationsPage />);
    expect(screen.queryByRole('button', { name: /grant consent/i })).not.toBeInTheDocument();
  });

  it('hides revoke row actions without the revoke permission', () => {
    granted = new Set<string>(['OpenIddict.Authorizations.Create']);
    authQuery = { data: mockOidcAuthorizations, isLoading: false };
    renderWithProviders(<OidcAuthorizationsPage />);
    expect(screen.queryByRole('button', { name: /revoke all/i })).not.toBeInTheDocument();
  });

  it('renders fallbacks for an authorization with no client and no scopes', () => {
    authQuery = {
      data: [
        {
          id: 'auth-empty',
          clientId: null,
          subject: 'lonely-user',
          status: 'valid',
          type: 'permanent',
          scopes: [],
        },
      ],
      isLoading: false,
    };
    renderWithProviders(<OidcAuthorizationsPage />);
    expect(screen.getByText('lonely-user')).toBeInTheDocument();
    // clientId and scopes both render an em dash
    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(2);
  });

  it('ignores non-Enter keystrokes in the scope input', async () => {
    const { user } = renderWithProviders(<OidcAuthorizationsPage />);
    await user.click(screen.getByRole('button', { name: /grant consent/i }));
    const dialog = within(await screen.findByRole('dialog'));
    const scopeInput = dialog.getByPlaceholderText('e.g. openid');
    await user.type(scopeInput, 'openid');
    // a non-Enter key does not commit the scope chip
    await user.keyboard('{Space}');
    expect(dialog.queryByRole('button', { name: 'Remove openid' })).not.toBeInTheDocument();
  });

  it('disables dialog actions while a mutation is pending', async () => {
    pending = true;
    authQuery = { data: mockOidcAuthorizations, isLoading: false };
    const { user } = renderWithProviders(<OidcAuthorizationsPage />);

    await user.click(screen.getByRole('button', { name: /grant consent/i }));
    let dialog = within(await screen.findByRole('dialog'));
    expect(dialog.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    await user.keyboard('{Escape}');

    await user.click(screen.getAllByRole('button', { name: 'Revoke' })[0]!);
    dialog = within(await screen.findByRole('dialog'));
    expect(dialog.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    await user.keyboard('{Escape}');

    await user.click(screen.getAllByRole('button', { name: 'Revoke All' })[0]!);
    dialog = within(await screen.findByRole('dialog'));
    expect(dialog.getByRole('button', { name: 'Cancel' })).toBeDisabled();
  });

  it('grants an authorization, adding scopes via the Add button', async () => {
    const { user } = renderWithProviders(<OidcAuthorizationsPage />);
    await user.click(screen.getByRole('button', { name: /grant consent/i }));

    const dialog = within(await screen.findByRole('dialog'));
    await user.type(dialog.getByLabelText('Subject (User ID)'), 'usr-42');
    await user.type(dialog.getByLabelText('Client ID'), 'web-spa');

    const scopeInput = dialog.getByPlaceholderText('e.g. openid');
    await user.type(scopeInput, 'openid');
    await user.click(dialog.getByRole('button', { name: 'Add' }));
    // duplicate is ignored
    await user.type(scopeInput, 'openid');
    await user.click(dialog.getByRole('button', { name: 'Add' }));
    // second scope via Enter key
    await user.type(scopeInput, 'profile{Enter}');

    await user.click(dialog.getByRole('button', { name: 'Grant Consent' }));

    await waitFor(() => expect(createMutate).toHaveBeenCalledTimes(1));
    expect(createMutate).toHaveBeenCalledWith({
      subject: 'usr-42',
      clientId: 'web-spa',
      scopes: ['openid', 'profile'],
    });
    expect(toastSuccess).toHaveBeenCalledWith('Authorization granted successfully');
  });

  it('removes a scope chip before granting', async () => {
    const { user } = renderWithProviders(<OidcAuthorizationsPage />);
    await user.click(screen.getByRole('button', { name: /grant consent/i }));

    const dialog = within(await screen.findByRole('dialog'));
    await user.type(dialog.getByLabelText('Subject (User ID)'), 'usr-42');
    await user.type(dialog.getByLabelText('Client ID'), 'web-spa');
    const scopeInput = dialog.getByPlaceholderText('e.g. openid');
    await user.type(scopeInput, 'openid{Enter}');
    await user.type(scopeInput, 'profile{Enter}');

    await user.click(dialog.getByRole('button', { name: 'Remove openid' }));
    await user.click(dialog.getByRole('button', { name: 'Grant Consent' }));

    await waitFor(() => expect(createMutate).toHaveBeenCalledTimes(1));
    expect(createMutate.mock.calls[0]![0]).toMatchObject({ scopes: ['profile'] });
  });

  it('shows a client-not-found toast when granting returns 404', async () => {
    createMutate.mockRejectedValue({ response: { status: 404 } });
    const { user } = renderWithProviders(<OidcAuthorizationsPage />);
    await user.click(screen.getByRole('button', { name: /grant consent/i }));
    const dialog = within(await screen.findByRole('dialog'));
    await user.type(dialog.getByLabelText('Subject (User ID)'), 'usr-42');
    await user.type(dialog.getByLabelText('Client ID'), 'missing');
    await user.click(dialog.getByRole('button', { name: 'Grant Consent' }));
    await waitFor(() => expect(toastError).toHaveBeenCalledWith('Client not found'));
  });

  it('shows a generic toast on a non-404 grant failure', async () => {
    createMutate.mockRejectedValue({ response: { status: 500 } });
    const { user } = renderWithProviders(<OidcAuthorizationsPage />);
    await user.click(screen.getByRole('button', { name: /grant consent/i }));
    const dialog = within(await screen.findByRole('dialog'));
    await user.type(dialog.getByLabelText('Subject (User ID)'), 'usr-42');
    await user.type(dialog.getByLabelText('Client ID'), 'web-spa');
    await user.click(dialog.getByRole('button', { name: 'Grant Consent' }));
    await waitFor(() => expect(toastError).toHaveBeenCalledWith('Failed to create authorization'));
  });

  it('cancels the grant dialog without calling the mutation', async () => {
    const { user } = renderWithProviders(<OidcAuthorizationsPage />);
    await user.click(screen.getByRole('button', { name: /grant consent/i }));
    const dialog = within(await screen.findByRole('dialog'));
    await user.click(dialog.getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(createMutate).not.toHaveBeenCalled();
  });

  it('revokes a single authorization', async () => {
    authQuery = { data: mockOidcAuthorizations, isLoading: false };
    const { user } = renderWithProviders(<OidcAuthorizationsPage />);
    await user.click(screen.getAllByRole('button', { name: 'Revoke' })[0]!);

    const dialog = within(await screen.findByRole('dialog'));
    expect(dialog.getByText('Revoke Authorization')).toBeInTheDocument();
    await user.click(dialog.getByRole('button', { name: 'Revoke' }));

    await waitFor(() => expect(revokeMutate).toHaveBeenCalledWith('auth_01HZ9KQX0000000000001'));
    expect(toastSuccess).toHaveBeenCalledWith('Authorization revoked successfully');
  });

  it('shows an error toast when single revoke fails', async () => {
    revokeMutate.mockRejectedValue(new Error('boom'));
    authQuery = { data: mockOidcAuthorizations, isLoading: false };
    const { user } = renderWithProviders(<OidcAuthorizationsPage />);
    await user.click(screen.getAllByRole('button', { name: 'Revoke' })[0]!);
    const dialog = within(await screen.findByRole('dialog'));
    await user.click(dialog.getByRole('button', { name: 'Revoke' }));
    await waitFor(() => expect(toastError).toHaveBeenCalledWith('Failed to revoke authorization'));
  });

  it('revokes all authorizations for a user', async () => {
    authQuery = { data: mockOidcAuthorizations, isLoading: false };
    const { user } = renderWithProviders(<OidcAuthorizationsPage />);
    await user.click(screen.getAllByRole('button', { name: 'Revoke All' })[0]!);

    const dialog = within(await screen.findByRole('dialog'));
    expect(dialog.getByText('Revoke User Authorizations')).toBeInTheDocument();
    await user.click(dialog.getByRole('button', { name: 'Revoke All' }));

    await waitFor(() => expect(revokeUserMutate).toHaveBeenCalledWith('usr_01HZ9KQX0000000000001'));
    expect(toastSuccess).toHaveBeenCalledWith('User authorizations revoked successfully');
  });

  it('shows an error toast when revoke-all fails', async () => {
    revokeUserMutate.mockRejectedValue(new Error('boom'));
    authQuery = { data: mockOidcAuthorizations, isLoading: false };
    const { user } = renderWithProviders(<OidcAuthorizationsPage />);
    await user.click(screen.getAllByRole('button', { name: 'Revoke All' })[0]!);
    const dialog = within(await screen.findByRole('dialog'));
    await user.click(dialog.getByRole('button', { name: 'Revoke All' }));
    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith('Failed to revoke user authorizations')
    );
  });
});
