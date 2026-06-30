import { sampleDuplicates } from '@granit/react-parties/testing';
import { screen } from '@testing-library/react';

import { DuplicatesInboxPage } from '../components/duplicates-inbox-page';

import { renderWithProviders } from './test-utils';

import type { PartyDuplicateCandidateResponse } from '@granit/parties';

const candidate: PartyDuplicateCandidateResponse = sampleDuplicates[0]!;

vi.mock('../components/duplicates-inbox', () => ({
  DuplicatesInbox: ({ onMerge }: { onMerge?: (row: PartyDuplicateCandidateResponse) => void }) => (
    <div data-slot="duplicates-inbox-stub">
      <button type="button" onClick={() => onMerge?.(candidate)}>
        stub-merge
      </button>
    </div>
  ),
}));

vi.mock('../components/merge-wizard', () => ({
  MergeWizard: () => <div data-slot="merge-wizard-stub" />,
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

  it('opens the survivor picker when a row requests a merge', async () => {
    const { user } = renderWithProviders(<DuplicatesInboxPage />);
    await user.click(screen.getByRole('button', { name: 'stub-merge' }));
    expect(await screen.findByText('Pick the surviving party')).toBeInTheDocument();
  });
});
