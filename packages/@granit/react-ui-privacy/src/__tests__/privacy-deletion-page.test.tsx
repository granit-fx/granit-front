import { screen } from '@testing-library/react';

import { PrivacyDeletionPage } from '../privacy-deletion-page';

import { renderWithProviders } from './test-utils';

vi.mock('@granit/react-privacy', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useDeletionRequests: () => ({ data: [], isLoading: false, refetch: vi.fn() }),
    useRequestDeletion: () => ({ mutateAsync: vi.fn(), isPending: false }),
    useCancelDeletion: () => ({ mutateAsync: vi.fn(), isPending: false }),
  };
});

describe('PrivacyDeletionPage', () => {
  it('should render the page title', () => {
    renderWithProviders(<PrivacyDeletionPage />);
    expect(screen.getByText('Account Deletion')).toBeInTheDocument();
  });

  it('should have data-slot attribute', () => {
    renderWithProviders(<PrivacyDeletionPage />);
    expect(document.querySelector('[data-slot="privacy-deletion-page"]')).toBeInTheDocument();
  });
});
