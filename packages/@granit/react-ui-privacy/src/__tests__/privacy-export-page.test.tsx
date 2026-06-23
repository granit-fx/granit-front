import { screen } from '@testing-library/react';

import { PrivacyExportPage } from '../privacy-export-page';

import { renderWithProviders } from './test-utils';

vi.mock('@granit/react-privacy', () => ({
  usePrivacyExports: () => ({ data: [], isLoading: false, refetch: vi.fn() }),
  useRequestExport: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useRequestExportOnBehalfOf: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useExportScopes: () => ({ data: undefined, isLoading: false }),
  usePrivacyConfig: () => ({ client: {}, basePath: '/api/v1/privacy' }),
}));

describe('PrivacyExportPage', () => {
  it('should render the page title', () => {
    renderWithProviders(<PrivacyExportPage />);
    expect(screen.getByText('My Data')).toBeInTheDocument();
  });

  it('should have data-slot attribute', () => {
    renderWithProviders(<PrivacyExportPage />);
    expect(document.querySelector('[data-slot="privacy-export-page"]')).toBeInTheDocument();
  });
});
