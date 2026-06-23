import { screen, waitFor } from '@testing-library/react';

import { MergeFromCandidate } from '../components/merge-from-candidate';

import { renderWithProviders } from './test-utils';

import type { PartyDuplicateCandidateResponse, PartyId } from '@granit/parties';
import type * as RouterDom from 'react-router-dom';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof RouterDom>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('@granit/react-parties', () => ({
  MergeWizard: ({
    survivorId,
    loserId,
    onSuccess,
  }: {
    survivorId: PartyId;
    loserId: PartyId;
    onSuccess?: (r: { survivorId: PartyId; loserId: PartyId }) => void;
  }) => (
    <div data-slot="merge-wizard-stub">
      <p>
        wizard for {survivorId} ← {loserId}
      </p>
      <button type="button" onClick={() => onSuccess?.({ survivorId, loserId })}>
        wizard-success
      </button>
    </div>
  ),
}));

const candidate: PartyDuplicateCandidateResponse = {
  id: 'cand-1' as PartyDuplicateCandidateResponse['id'],
  partyId: 'p-a' as PartyId,
  candidateId: 'p-b' as PartyId,
  tier: 'Deterministic',
  score: 0.95,
  signals: [],
  dismissedAt: null,
  createdAt: '2026-04-01T00:00:00Z',
  updatedAt: '2026-04-01T00:00:00Z',
};

describe('MergeFromCandidate', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('returns null content when candidate is null', () => {
    const { container } = renderWithProviders(
      <MergeFromCandidate candidate={null} onClose={vi.fn()} />
    );
    expect(
      container.querySelector('[data-slot="merge-from-candidate-survivor-picker"]')
    ).toBeNull();
  });

  it('renders a survivor picker with both party ids when a candidate is present', () => {
    renderWithProviders(<MergeFromCandidate candidate={candidate} onClose={vi.fn()} />);
    expect(screen.getByText('Pick the surviving party')).toBeInTheDocument();
    expect(screen.getByText('p-a')).toBeInTheDocument();
    expect(screen.getByText('p-b')).toBeInTheDocument();
  });

  it('hands off the picked survivor/loser to the wizard', async () => {
    const { user } = renderWithProviders(
      <MergeFromCandidate candidate={candidate} onClose={vi.fn()} />
    );

    await user.click(screen.getByRole('button', { name: 'Next' }));

    expect(await screen.findByText(/wizard for p-a ← p-b/)).toBeInTheDocument();
  });

  it('flips survivor when Party B is selected before confirm', async () => {
    const { user } = renderWithProviders(
      <MergeFromCandidate candidate={candidate} onClose={vi.fn()} />
    );

    await user.click(screen.getByRole('radio', { name: /Party B/ }));
    await user.click(screen.getByRole('button', { name: 'Next' }));

    expect(await screen.findByText(/wizard for p-b ← p-a/)).toBeInTheDocument();
  });

  it('navigates to the survivor on wizard success', async () => {
    const { user } = renderWithProviders(
      <MergeFromCandidate candidate={candidate} onClose={vi.fn()} />
    );

    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.click(await screen.findByRole('button', { name: 'wizard-success' }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/parties/p-a');
    });
  });
});
