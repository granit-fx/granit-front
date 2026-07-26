import { mockOidcApplications } from '@granit/react-openiddict-admin/testing';
import { screen, waitFor, within } from '@testing-library/react';

import { OidcApplicationsPage } from '../applications/oidc-applications-page';

import { renderWithProviders } from './test-utils';

import type { AdminOidcApplicationResponse } from '@granit/openiddict-admin';

// An application with all optional fields null/empty, to exercise the `?? '—'`
// row fallbacks, the XCircle "no signing key" path is shared, and the
// null-coalescing branches in openEdit.
const nullApp: AdminOidcApplicationResponse = {
  clientId: 'sparse-client',
  displayName: null,
  type: null,
  tenantId: null,
  permissions: null,
  redirectUris: null,
  postLogoutRedirectUris: null,
  consentType: null,
  clientSide: null,
  deviceKind: null,
  hasSigningKey: true,
};

// Tests assign a plain array (plus optional totalCount/hasMore); the mocked hook
// wraps it in the PagedResult envelope the page actually consumes.
let appsQuery: {
  data: readonly AdminOidcApplicationResponse[];
  isLoading: boolean;
  totalCount?: number | null;
  hasMore?: boolean;
} = {
  data: [],
  isLoading: false,
};
let canManage = true;

function appsPage() {
  return {
    data: {
      items: appsQuery.data,
      // `null` is a meaningful wire value (backend withheld the count), so only
      // an absent key falls back to the fixture length.
      totalCount: 'totalCount' in appsQuery ? appsQuery.totalCount : appsQuery.data.length,
      hasMore: appsQuery.hasMore ?? false,
    },
    isLoading: appsQuery.isLoading,
  };
}

const createMutate = vi.fn();
const updateMutate = vi.fn();
const deleteMutate = vi.fn();
let pending = false;

vi.mock('@granit/react-openiddict-admin', () => ({
  useOidcApplications: () => appsPage(),
  useCreateOidcApplication: () => ({ mutateAsync: createMutate, isPending: pending }),
  useUpdateOidcApplication: () => ({ mutateAsync: updateMutate, isPending: pending }),
  useDeleteOidcApplication: () => ({ mutateAsync: deleteMutate, isPending: pending }),
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
  appsQuery = { data: [], isLoading: false };
  canManage = true;
  pending = false;
  // The real mutation resolves the created application; without a body the page
  // cannot tell whether a secret was generated.
  createMutate.mockReset().mockResolvedValue({ ...nullApp, clientId: 'new-client' });
  updateMutate.mockReset().mockResolvedValue(undefined);
  deleteMutate.mockReset().mockResolvedValue(undefined);
  toastSuccess.mockReset();
  toastError.mockReset();
});

describe('OidcApplicationsPage — server-side paging', () => {
  it('hides pagination controls when a single page covers the results', () => {
    appsQuery = { data: mockOidcApplications, isLoading: false, totalCount: 3 };
    renderWithProviders(<OidcApplicationsPage />);
    expect(document.querySelector('[data-slot="table-pagination"]')).not.toBeInTheDocument();
  });

  it('shows pagination controls once totalCount exceeds the page size', () => {
    appsQuery = { data: mockOidcApplications, isLoading: false, totalCount: 90, hasMore: true };
    renderWithProviders(<OidcApplicationsPage />);
    expect(document.querySelector('[data-slot="table-pagination"]')).toBeInTheDocument();
  });

  it('renders rows from the envelope items', () => {
    appsQuery = { data: mockOidcApplications, isLoading: false, totalCount: 90 };
    renderWithProviders(<OidcApplicationsPage />);
    expect(screen.getByText(mockOidcApplications[0]!.clientId!)).toBeInTheDocument();
  });
});

describe('OidcApplicationsPage — server-generated client secret', () => {
  it('requests generation and reveals the returned secret once', async () => {
    createMutate.mockResolvedValue({
      ...nullApp,
      clientId: 'new-client',
      generatedClientSecret: 'sup3r-s3cr3t',
    });
    const { user } = renderWithProviders(<OidcApplicationsPage />);
    await user.click(screen.getByRole('button', { name: 'Create Application' }));

    const dialog = within(await screen.findByRole('dialog'));
    await user.type(dialog.getByLabelText('Client ID'), 'new-client');
    await user.click(dialog.getByLabelText('Generate the client secret'));
    await user.click(dialog.getByRole('button', { name: 'Create Application' }));

    await waitFor(() => expect(createMutate).toHaveBeenCalledTimes(1));
    expect(createMutate.mock.calls[0]![0]).toMatchObject({
      clientId: 'new-client',
      generateClientSecret: true,
    });

    expect(
      await screen.findByRole('heading', { name: 'Client secret generated' })
    ).toBeInTheDocument();
    expect(screen.getByText('sup3r-s3cr3t')).toBeInTheDocument();
  });

  it('does not send an explicit clientSecret when generation is requested', async () => {
    const { user } = renderWithProviders(<OidcApplicationsPage />);
    await user.click(screen.getByRole('button', { name: 'Create Application' }));

    const dialog = within(await screen.findByRole('dialog'));
    await user.type(dialog.getByLabelText('Client ID'), 'new-client');
    await user.type(dialog.getByLabelText('Client Secret'), 'typed-by-hand');
    await user.click(dialog.getByLabelText('Generate the client secret'));
    await user.click(dialog.getByRole('button', { name: 'Create Application' }));

    await waitFor(() => expect(createMutate).toHaveBeenCalledTimes(1));
    expect(createMutate.mock.calls[0]![0]).toMatchObject({ generateClientSecret: true });
    expect(createMutate.mock.calls[0]![0].clientSecret).toBeUndefined();
  });

  it('does not open the reveal dialog when no secret was generated', async () => {
    const { user } = renderWithProviders(<OidcApplicationsPage />);
    await user.click(screen.getByRole('button', { name: 'Create Application' }));

    const dialog = within(await screen.findByRole('dialog'));
    await user.type(dialog.getByLabelText('Client ID'), 'new-client');
    await user.click(dialog.getByRole('button', { name: 'Create Application' }));

    await waitFor(() => expect(createMutate).toHaveBeenCalledTimes(1));
    expect(createMutate.mock.calls[0]![0].generateClientSecret).toBeUndefined();
    expect(
      screen.queryByRole('heading', { name: 'Client secret generated' })
    ).not.toBeInTheDocument();
  });
});

describe('OidcApplicationsPage', () => {
  it('renders the page title and data-slot', () => {
    renderWithProviders(<OidcApplicationsPage />);
    expect(screen.getByRole('heading', { name: 'OIDC Applications' })).toBeInTheDocument();
    expect(document.querySelector('[data-slot="oidc-applications-page"]')).toBeInTheDocument();
  });

  it('shows the empty state when no applications are registered', () => {
    renderWithProviders(<OidcApplicationsPage />);
    expect(screen.getByText('No applications registered yet.')).toBeInTheDocument();
  });

  it('does not show the empty state while loading', () => {
    appsQuery = { data: [], isLoading: true };
    renderWithProviders(<OidcApplicationsPage />);
    expect(screen.queryByText('No applications registered yet.')).not.toBeInTheDocument();
  });

  it('renders a row per application with permission/uri counts and signing-key icons', () => {
    appsQuery = { data: mockOidcApplications, isLoading: false };
    renderWithProviders(<OidcApplicationsPage />);
    expect(screen.getByText('granit-showcase-admin')).toBeInTheDocument();
    expect(screen.getByText('Granit Showcase Admin')).toBeInTheDocument();
    // no signing key on both fixtures
    expect(screen.getAllByLabelText('No signing key').length).toBeGreaterThan(0);
    expect(screen.getAllByRole('button', { name: 'Edit' }).length).toBe(2);
    expect(screen.getAllByRole('button', { name: 'Delete' }).length).toBe(2);
  });

  it('exposes the create action when the user can manage applications', () => {
    renderWithProviders(<OidcApplicationsPage />);
    expect(screen.getByRole('button', { name: /create application/i })).toBeInTheDocument();
  });

  it('hides the create action and row actions without the manage permission', () => {
    canManage = false;
    appsQuery = { data: mockOidcApplications, isLoading: false };
    renderWithProviders(<OidcApplicationsPage />);
    expect(screen.queryByRole('button', { name: /create application/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument();
  });

  it('creates an application from the dialog and shows a success toast', async () => {
    const { user } = renderWithProviders(<OidcApplicationsPage />);
    await user.click(screen.getByRole('button', { name: /create application/i }));

    const dialog = within(await screen.findByRole('dialog'));
    await user.type(dialog.getByLabelText('Client ID'), 'new-client');
    await user.type(dialog.getByLabelText('Display Name'), 'New Client');
    await user.type(dialog.getByLabelText('Redirect URIs'), 'https://app.example.com/callback');

    await user.click(dialog.getByRole('button', { name: 'Create Application' }));

    await waitFor(() => expect(createMutate).toHaveBeenCalledTimes(1));
    expect(createMutate.mock.calls[0]![0]).toMatchObject({
      clientId: 'new-client',
      displayName: 'New Client',
      redirectUris: ['https://app.example.com/callback'],
    });
    expect(toastSuccess).toHaveBeenCalledWith('Application created successfully');
  });

  it('selects a type via the Type dropdown when creating', async () => {
    const { user } = renderWithProviders(<OidcApplicationsPage />);
    await user.click(screen.getByRole('button', { name: /create application/i }));

    const dialog = within(await screen.findByRole('dialog'));
    await user.type(dialog.getByLabelText('Client ID'), 'typed-client');

    // open the Type select (first combobox in the dialog) and pick "Web"
    const comboboxes = dialog.getAllByRole('combobox');
    await user.click(comboboxes[0]!);
    await user.click(await screen.findByRole('option', { name: 'Web' }));

    await user.click(dialog.getByRole('button', { name: 'Create Application' }));

    await waitFor(() => expect(createMutate).toHaveBeenCalledTimes(1));
    expect(createMutate.mock.calls[0]![0]).toMatchObject({ clientId: 'typed-client', type: 'web' });
  });

  it('shows an error toast when application creation fails', async () => {
    createMutate.mockRejectedValue(new Error('boom'));
    const { user } = renderWithProviders(<OidcApplicationsPage />);
    await user.click(screen.getByRole('button', { name: /create application/i }));

    const dialog = within(await screen.findByRole('dialog'));
    await user.type(dialog.getByLabelText('Client ID'), 'new-client');
    await user.click(dialog.getByRole('button', { name: 'Create Application' }));

    await waitFor(() => expect(toastError).toHaveBeenCalledWith('Failed to create application'));
  });

  it('cancels the create dialog without calling the mutation', async () => {
    const { user } = renderWithProviders(<OidcApplicationsPage />);
    await user.click(screen.getByRole('button', { name: /create application/i }));
    const dialog = within(await screen.findByRole('dialog'));
    await user.click(dialog.getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(createMutate).not.toHaveBeenCalled();
  });

  it('edits an application and shows a success toast', async () => {
    appsQuery = { data: mockOidcApplications, isLoading: false };
    const { user } = renderWithProviders(<OidcApplicationsPage />);
    await user.click(screen.getAllByRole('button', { name: 'Edit' })[0]!);

    const dialog = within(await screen.findByRole('dialog'));
    expect(dialog.getByText('Edit Application')).toBeInTheDocument();
    const displayName = dialog.getByLabelText('Display Name');
    await user.clear(displayName);
    await user.type(displayName, 'Renamed App');
    await user.click(dialog.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(updateMutate).toHaveBeenCalledTimes(1));
    expect(updateMutate.mock.calls[0]![0]).toMatchObject({
      clientId: 'granit-showcase-admin',
      request: { displayName: 'Renamed App' },
    });
    expect(toastSuccess).toHaveBeenCalledWith('Application updated successfully');
  });

  it('renders fallback dashes and the has-signing-key icon for a sparse application', () => {
    appsQuery = { data: [nullApp], isLoading: false };
    renderWithProviders(<OidcApplicationsPage />);
    expect(screen.getByText('sparse-client')).toBeInTheDocument();
    expect(screen.getByLabelText('Has signing key')).toBeInTheDocument();
    // displayName, type, permissions, redirect, tenant all fall back to dashes
    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(4);
  });

  it('opens the edit dialog for a sparse application using null fallbacks', async () => {
    appsQuery = { data: [nullApp], isLoading: false };
    const { user } = renderWithProviders(<OidcApplicationsPage />);
    await user.click(screen.getByRole('button', { name: 'Edit' }));

    const dialog = within(await screen.findByRole('dialog'));
    expect(dialog.getByText('sparse-client')).toBeInTheDocument();
    await user.click(dialog.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(updateMutate).toHaveBeenCalledTimes(1));
    expect(updateMutate.mock.calls[0]![0]).toMatchObject({
      clientId: 'sparse-client',
      request: { displayName: null, type: null },
    });
  });

  it('shows spinners and disables actions on every dialog while pending', async () => {
    pending = true;
    appsQuery = { data: mockOidcApplications, isLoading: false };
    const { user } = renderWithProviders(<OidcApplicationsPage />);

    await user.click(screen.getByRole('button', { name: /create application/i }));
    let dialog = within(await screen.findByRole('dialog'));
    expect(dialog.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    expect(dialog.getByRole('button', { name: 'Create Application' })).toBeDisabled();
    await user.keyboard('{Escape}');

    await user.click(screen.getAllByRole('button', { name: 'Edit' })[0]!);
    dialog = within(await screen.findByRole('dialog'));
    expect(dialog.getByRole('button', { name: 'Save' })).toBeDisabled();
    await user.keyboard('{Escape}');

    await user.click(screen.getAllByRole('button', { name: 'Delete' })[0]!);
    dialog = within(await screen.findByRole('dialog'));
    expect(dialog.getByRole('button', { name: 'Delete' })).toBeDisabled();
  });

  it('edits every form control including the selects and uri/permission textareas', async () => {
    appsQuery = { data: mockOidcApplications, isLoading: false };
    const { user } = renderWithProviders(<OidcApplicationsPage />);
    await user.click(screen.getAllByRole('button', { name: 'Edit' })[0]!);

    const dialog = within(await screen.findByRole('dialog'));

    // Type select
    const comboboxes = dialog.getAllByRole('combobox');
    await user.click(comboboxes[0]!);
    await user.click(await screen.findByRole('option', { name: 'Native' }));
    // Consent type select
    await user.click(dialog.getAllByRole('combobox')[1]!);
    await user.click(await screen.findByRole('option', { name: 'Explicit' }));
    // Client side select
    await user.click(dialog.getAllByRole('combobox')[2]!);
    await user.click(await screen.findByRole('option', { name: 'Tenant' }));

    const redirect = dialog.getByLabelText('Redirect URIs');
    await user.clear(redirect);
    await user.type(redirect, 'https://edited.example.com/cb');

    const permissions = dialog.getByLabelText('Permissions');
    await user.clear(permissions);
    await user.type(permissions, 'ept:token');

    await user.click(dialog.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(updateMutate).toHaveBeenCalledTimes(1));
    expect(updateMutate.mock.calls[0]![0]).toMatchObject({
      clientId: 'granit-showcase-admin',
      request: {
        type: 'native',
        consentType: 'explicit',
        clientSide: 2,
        redirectUris: ['https://edited.example.com/cb'],
        permissions: ['ept:token'],
      },
    });
  });

  it('resets the Type select back to none when creating', async () => {
    const { user } = renderWithProviders(<OidcApplicationsPage />);
    await user.click(screen.getByRole('button', { name: /create application/i }));
    const dialog = within(await screen.findByRole('dialog'));
    await user.type(dialog.getByLabelText('Client ID'), 'none-client');

    const typeSelect = dialog.getAllByRole('combobox')[0]!;
    await user.click(typeSelect);
    await user.click(await screen.findByRole('option', { name: 'Web' }));
    await user.click(typeSelect);
    await user.click(await screen.findByRole('option', { name: '—' }));

    // Client side select to a numeric value, then post-logout URIs
    await user.click(dialog.getAllByRole('combobox')[2]!);
    await user.click(await screen.findByRole('option', { name: 'Host' }));
    await user.type(
      dialog.getByLabelText('Post-Logout Redirect URIs'),
      'https://app.example.com/logout'
    );
    await user.type(dialog.getByLabelText('Client Secret'), 's3cret');
    await user.type(dialog.getByLabelText('Signing Key (JWK)'), '{{ "kty": "RSA" }');

    await user.click(dialog.getByRole('button', { name: 'Create Application' }));
    await waitFor(() => expect(createMutate).toHaveBeenCalledTimes(1));
    expect(createMutate.mock.calls[0]![0]).toMatchObject({
      clientId: 'none-client',
      type: undefined,
      clientSide: 1,
      clientSecret: 's3cret',
      postLogoutRedirectUris: ['https://app.example.com/logout'],
    });
  });

  it('shows a not-found toast when editing returns 404', async () => {
    updateMutate.mockRejectedValue({ response: { status: 404 } });
    appsQuery = { data: mockOidcApplications, isLoading: false };
    const { user } = renderWithProviders(<OidcApplicationsPage />);
    await user.click(screen.getAllByRole('button', { name: 'Edit' })[0]!);
    const dialog = within(await screen.findByRole('dialog'));
    await user.click(dialog.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(toastError).toHaveBeenCalledWith('Application not found'));
  });

  it('shows a generic error toast on a non-404 edit failure', async () => {
    updateMutate.mockRejectedValue({ response: { status: 500 } });
    appsQuery = { data: mockOidcApplications, isLoading: false };
    const { user } = renderWithProviders(<OidcApplicationsPage />);
    await user.click(screen.getAllByRole('button', { name: 'Edit' })[0]!);
    const dialog = within(await screen.findByRole('dialog'));
    await user.click(dialog.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(toastError).toHaveBeenCalledWith('Failed to update application'));
  });

  it('deletes an application and shows a success toast', async () => {
    appsQuery = { data: mockOidcApplications, isLoading: false };
    const { user } = renderWithProviders(<OidcApplicationsPage />);
    await user.click(screen.getAllByRole('button', { name: 'Delete' })[0]!);

    const dialog = within(await screen.findByRole('dialog'));
    expect(dialog.getByText('Delete Application')).toBeInTheDocument();
    await user.click(dialog.getByRole('button', { name: 'Delete' }));

    await waitFor(() => expect(deleteMutate).toHaveBeenCalledWith('granit-showcase-admin'));
    expect(toastSuccess).toHaveBeenCalledWith('Application deleted successfully');
  });

  it('shows an error toast when deletion fails', async () => {
    deleteMutate.mockRejectedValue(new Error('boom'));
    appsQuery = { data: mockOidcApplications, isLoading: false };
    const { user } = renderWithProviders(<OidcApplicationsPage />);
    await user.click(screen.getAllByRole('button', { name: 'Delete' })[0]!);
    const dialog = within(await screen.findByRole('dialog'));
    await user.click(dialog.getByRole('button', { name: 'Delete' }));
    await waitFor(() => expect(toastError).toHaveBeenCalledWith('Failed to delete application'));
  });
});
