import { screen } from '@testing-library/react';

import { OidcAuthorizationsPage } from '../authorizations/oidc-authorizations-page';

import { renderWithProviders } from './test-utils';

const sampleAuthorization = {
  id: 'auth-1',
  subject: 'user-1',
  clientId: 'web-spa',
  status: 'valid',
  type: 'permanent',
  scopes: ['openid', 'profile'],
  creationDate: '2026-01-01T00:00:00Z',
};

let authQuery: { data: readonly (typeof sampleAuthorization)[]; isLoading: boolean } = {
  data: [],
  isLoading: false,
};
let granted = new Set<string>([
  'OpenIddict.Authorizations.Create',
  'OpenIddict.Authorizations.Revoke',
]);

vi.mock('@granit/react-openiddict-admin', () => ({
  useOidcAuthorizations: () => authQuery,
  useCreateOidcAuthorization: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useRevokeAuthorization: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useRevokeUserAuthorizations: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock('@granit/react-authorization', () => ({
  usePermissions: () => ({ hasPermission: (p: string) => granted.has(p), isLoading: false }),
}));

beforeEach(() => {
  authQuery = { data: [], isLoading: false };
  granted = new Set<string>([
    'OpenIddict.Authorizations.Create',
    'OpenIddict.Authorizations.Revoke',
  ]);
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

  it('renders a row per authorization with subject and client', () => {
    authQuery = { data: [sampleAuthorization], isLoading: false };
    renderWithProviders(<OidcAuthorizationsPage />);
    expect(screen.getByText('user-1')).toBeInTheDocument();
    expect(screen.getByText('web-spa')).toBeInTheDocument();
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
});
