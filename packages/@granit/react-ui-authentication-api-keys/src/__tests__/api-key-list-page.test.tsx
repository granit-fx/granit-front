import { screen } from '@testing-library/react';

import { ApiKeyListPage } from '../api-key-list-page';

import { renderWithProviders } from './test-utils';

vi.mock('@granit/react-authentication-api-keys', () => ({
  useApiKeys: () => ({ data: undefined, isLoading: true }),
  useApiKeysQueryMeta: () => ({ data: undefined, isLoading: false }),
  useRevokeApiKey: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useRotateApiKey: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

describe('ApiKeyListPage', () => {
  it('should render the page title', () => {
    renderWithProviders(<ApiKeyListPage />);
    expect(screen.getByText('API Key Management')).toBeInTheDocument();
  });

  it('should have data-slot attribute', () => {
    renderWithProviders(<ApiKeyListPage />);
    expect(document.querySelector('[data-slot="api-key-list-page"]')).toBeInTheDocument();
  });

  it('should render create button', () => {
    renderWithProviders(<ApiKeyListPage />);
    expect(screen.getByText('New API Key')).toBeInTheDocument();
  });
});
