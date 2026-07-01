import { screen } from '@testing-library/react';

import { StorageQuotaPage } from '../components/storage-quota-page';

import { renderWithProviders } from './test-utils';

// QuotaPanel self-fetches the tenant quota — stub it to a marker.
vi.mock('@granit/react-documents', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    QuotaPanel: () => <div data-testid="quota-panel" />,
  };
});

describe('StorageQuotaPage', () => {
  it('renders the page data-slot', () => {
    renderWithProviders(<StorageQuotaPage />);
    expect(document.querySelector('[data-slot="storage-quota-page"]')).toBeInTheDocument();
  });

  it('renders the title and subtitle', () => {
    renderWithProviders(<StorageQuotaPage />);
    expect(screen.getByRole('heading', { name: 'Storage usage' })).toBeInTheDocument();
    expect(
      screen.getByText('Tenant-wide document storage usage against the configured quota.')
    ).toBeInTheDocument();
  });

  it('mounts the quota panel', () => {
    renderWithProviders(<StorageQuotaPage />);
    expect(screen.getByTestId('quota-panel')).toBeInTheDocument();
  });
});
