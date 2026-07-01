import { screen } from '@testing-library/react';

import { TrashBinPage } from '../components/trash-bin-page';

import { renderWithProviders } from './test-utils';

vi.mock('@granit/react-authorization', () => ({
  usePermissions: () => ({ hasPermission: () => true, isLoading: false }),
}));

// TrashBin self-fetches trashed documents — stub it to a marker that echoes the
// resolved canManage permission so we can assert wiring.
vi.mock('@granit/react-documents', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    TrashBin: ({ canManage }: { canManage: boolean }) => (
      <div data-testid="trash-bin" data-can-manage={String(canManage)} />
    ),
  };
});

describe('TrashBinPage', () => {
  it('renders the page data-slot', () => {
    renderWithProviders(<TrashBinPage />);
    expect(document.querySelector('[data-slot="trash-bin-page"]')).toBeInTheDocument();
  });

  it('renders the title and subtitle', () => {
    renderWithProviders(<TrashBinPage />);
    expect(screen.getByRole('heading', { name: 'Trash' })).toBeInTheDocument();
    expect(
      screen.getByText(
        'Restore trashed documents or permanently delete them before automatic purge.'
      )
    ).toBeInTheDocument();
  });

  it('mounts the trash bin', () => {
    renderWithProviders(<TrashBinPage />);
    expect(screen.getByTestId('trash-bin')).toBeInTheDocument();
  });
});
