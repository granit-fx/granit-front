import { screen } from '@testing-library/react';

import { DocumentsExplorerPage } from '../documents-explorer-page';

import { renderWithProviders } from './test-utils';

// The page gates management actions on usePermissions, which otherwise needs an
// Axios client from a GranitClientProvider — stub it (matches the other UI packages).
vi.mock('@granit/react-authorization', () => ({
  usePermissions: () => ({ hasPermission: () => true, isLoading: false }),
}));

// The explorer and quota badge self-fetch and need package providers — stub them
// to simple markers so we test the page wrapper (header + data-slot + labels wiring).
vi.mock('@granit/react-documents', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    DocumentsExplorer: ({ canManage }: { canManage: boolean }) => (
      <div data-testid="documents-explorer" data-can-manage={String(canManage)} />
    ),
    QuotaBadge: () => <div data-testid="quota-badge" />,
  };
});

describe('DocumentsExplorerPage', () => {
  it('renders the page data-slot', () => {
    renderWithProviders(<DocumentsExplorerPage />);
    expect(document.querySelector('[data-slot="documents-explorer-page"]')).toBeInTheDocument();
  });

  it('renders the title and subtitle', () => {
    renderWithProviders(<DocumentsExplorerPage />);
    expect(screen.getByRole('heading', { name: 'Documents' })).toBeInTheDocument();
    expect(
      screen.getByText('Browse, upload, and manage your tenant documents.')
    ).toBeInTheDocument();
  });

  it('mounts the explorer and quota badge', () => {
    renderWithProviders(<DocumentsExplorerPage />);
    expect(screen.getByTestId('documents-explorer')).toBeInTheDocument();
    expect(screen.getByTestId('quota-badge')).toBeInTheDocument();
  });
});
