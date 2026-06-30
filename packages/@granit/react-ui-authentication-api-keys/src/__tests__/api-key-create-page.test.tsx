import { screen } from '@testing-library/react';

import { ApiKeyCreatePage } from '../components/api-key-create-page';

import { renderWithProviders } from './test-utils';

vi.mock('@granit/react-authentication-api-keys', () => ({
  useCreateApiKey: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

describe('ApiKeyCreatePage', () => {
  it('should have data-slot attribute', () => {
    renderWithProviders(<ApiKeyCreatePage />, { route: '/api-keys/create' });
    expect(document.querySelector('[data-slot="api-key-create-page"]')).toBeInTheDocument();
  });

  it('should render the heading', () => {
    renderWithProviders(<ApiKeyCreatePage />, { route: '/api-keys/create' });
    expect(screen.getByRole('heading', { name: 'New API Key' })).toBeInTheDocument();
  });

  it('should render the name field', () => {
    renderWithProviders(<ApiKeyCreatePage />, { route: '/api-keys/create' });
    expect(screen.getByText('Name')).toBeInTheDocument();
  });

  it('should render the Type / Environment / Cache Behavior labels', () => {
    renderWithProviders(<ApiKeyCreatePage />, { route: '/api-keys/create' });
    expect(screen.getByText('Type')).toBeInTheDocument();
    expect(screen.getByText('Environment')).toBeInTheDocument();
    expect(screen.getByText('Cache Behavior')).toBeInTheDocument();
  });

  it('should render the permissions and CIDR fields', () => {
    renderWithProviders(<ApiKeyCreatePage />, { route: '/api-keys/create' });
    expect(screen.getByText('Permissions')).toBeInTheDocument();
    expect(screen.getByText('IP Restrictions (CIDR)')).toBeInTheDocument();
  });

  it('should render the submit button', () => {
    renderWithProviders(<ApiKeyCreatePage />, { route: '/api-keys/create' });
    expect(screen.getByRole('button', { name: 'New API Key' })).toBeInTheDocument();
  });
});
