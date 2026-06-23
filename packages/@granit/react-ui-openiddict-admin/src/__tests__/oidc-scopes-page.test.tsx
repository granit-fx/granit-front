import { screen } from '@testing-library/react';

import { OidcScopesPage } from '../scopes/oidc-scopes-page';

import { renderWithProviders } from './test-utils';

const sampleScope = {
  name: 'api',
  displayName: 'API access',
  description: 'Access to the protected API',
  resources: ['api'],
};

let scopesQuery: { data: readonly (typeof sampleScope)[]; isLoading: boolean } = {
  data: [],
  isLoading: false,
};
let canManage = true;

vi.mock('@granit/react-openiddict-admin', () => ({
  useOidcScopes: () => scopesQuery,
  useCreateOidcScope: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateOidcScope: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDeleteOidcScope: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock('@granit/react-authorization', () => ({
  usePermissions: () => ({ hasPermission: () => canManage, isLoading: false }),
}));

beforeEach(() => {
  scopesQuery = { data: [], isLoading: false };
  canManage = true;
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
    scopesQuery = { data: [sampleScope], isLoading: false };
    renderWithProviders(<OidcScopesPage />);
    expect(screen.getByText('API access')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
  });

  it('exposes the create action when the user can manage scopes', () => {
    renderWithProviders(<OidcScopesPage />);
    expect(screen.getByRole('button', { name: /create scope/i })).toBeInTheDocument();
  });

  it('hides the create action without the manage permission', () => {
    canManage = false;
    renderWithProviders(<OidcScopesPage />);
    expect(screen.queryByRole('button', { name: /create scope/i })).not.toBeInTheDocument();
  });
});
