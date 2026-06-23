import { screen } from '@testing-library/react';

import { DuplicatesInboxPage } from '../duplicates-inbox-page';

import { renderWithProviders } from './test-utils';

vi.mock('@granit/react-parties', () => ({
  DuplicatesInbox: ({ onMerge }: { onMerge?: (row: unknown) => void }) => (
    <div data-slot="duplicates-inbox-stub">
      <button type="button" onClick={() => onMerge?.({ id: 'cand-1' })}>
        stub-merge
      </button>
    </div>
  ),
  usePartiesQuery: () => ({ data: [], isLoading: false }),
}));

describe('DuplicatesInboxPage', () => {
  it('renders the page wrapper with the expected data-slot', () => {
    renderWithProviders(<DuplicatesInboxPage />);
    expect(document.querySelector('[data-slot="duplicates-inbox-page"]')).toBeInTheDocument();
  });

  it('mounts the upstream <DuplicatesInbox> component', () => {
    renderWithProviders(<DuplicatesInboxPage />);
    expect(screen.getByRole('button', { name: 'stub-merge' })).toBeInTheDocument();
  });
});
