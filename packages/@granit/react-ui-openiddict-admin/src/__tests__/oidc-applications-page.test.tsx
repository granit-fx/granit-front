import { screen } from '@testing-library/react';

import { OidcApplicationsPage } from '../applications/oidc-applications-page';

import { renderWithProviders } from './test-utils';

const sampleApp = {
  id: 'app-1',
  clientId: 'web-spa',
  displayName: 'Web SPA',
  type: 'web',
  permissions: [],
  redirectUris: ['https://app.example.com/callback'],
  postLogoutRedirectUris: [],
  consentType: 'explicit',
  signingKeyJwk: null,
  clientSide: 1,
  hasSigningKey: true,
};

let appsQuery: { data: readonly (typeof sampleApp)[]; isLoading: boolean } = {
  data: [],
  isLoading: false,
};
let canManage = true;

vi.mock('@granit/react-openiddict-admin', () => ({
  useOidcApplications: () => appsQuery,
  useCreateOidcApplication: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateOidcApplication: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDeleteOidcApplication: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock('@granit/react-authorization', () => ({
  usePermissions: () => ({ hasPermission: () => canManage, isLoading: false }),
}));

beforeEach(() => {
  appsQuery = { data: [], isLoading: false };
  canManage = true;
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

  it('renders a row per application with edit and delete actions', () => {
    appsQuery = { data: [sampleApp], isLoading: false };
    renderWithProviders(<OidcApplicationsPage />);
    expect(screen.getByText('web-spa')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
  });

  it('exposes the create action when the user can manage applications', () => {
    renderWithProviders(<OidcApplicationsPage />);
    expect(screen.getByRole('button', { name: /create application/i })).toBeInTheDocument();
  });

  it('hides the create action without the manage permission', () => {
    canManage = false;
    renderWithProviders(<OidcApplicationsPage />);
    expect(screen.queryByRole('button', { name: /create application/i })).not.toBeInTheDocument();
  });
});
