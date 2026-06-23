import { screen, waitFor, within } from '@testing-library/react';

import { LifecycleActions } from '../components/lifecycle-actions';

import { renderWithProviders } from './test-utils';

import type { PartyId } from '@granit/parties';

const suspendMutate = vi.fn();
const activateMutate = vi.fn();
const archiveMutate = vi.fn();

vi.mock('@granit/react-parties', () => ({
  useSuspendPartyMutation: () => ({
    mutateAsync: suspendMutate,
    isPending: false,
  }),
  useActivatePartyMutation: () => ({
    mutateAsync: activateMutate,
    isPending: false,
  }),
  useArchivePartyMutation: () => ({
    mutateAsync: archiveMutate,
    isPending: false,
  }),
}));

const partyId = 'p1' as PartyId;

describe('LifecycleActions', () => {
  beforeEach(() => {
    suspendMutate.mockReset().mockResolvedValue(undefined);
    activateMutate.mockReset().mockResolvedValue(undefined);
    archiveMutate.mockReset().mockResolvedValue(undefined);
  });

  it('shows a Suspend button when the party is Active', () => {
    renderWithProviders(<LifecycleActions partyId={partyId} status="Active" />);
    expect(screen.getByRole('button', { name: /suspend/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^activate$/i })).not.toBeInTheDocument();
  });

  it('shows an Activate button when the party is Suspended', () => {
    renderWithProviders(<LifecycleActions partyId={partyId} status="Suspended" />);
    expect(screen.getByRole('button', { name: /^activate$/i })).toBeInTheDocument();
  });

  it('shows the archived hint and no buttons for Archived parties', () => {
    renderWithProviders(<LifecycleActions partyId={partyId} status="Archived" />);
    expect(screen.getByText('Archived parties cannot be modified.')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('calls suspendParty when Suspend is clicked', async () => {
    const { user } = renderWithProviders(<LifecycleActions partyId={partyId} status="Active" />);
    await user.click(screen.getByRole('button', { name: /suspend/i }));
    await waitFor(() => {
      expect(suspendMutate).toHaveBeenCalledWith({ id: partyId });
    });
  });

  it('calls activateParty when Activate is clicked', async () => {
    const { user } = renderWithProviders(<LifecycleActions partyId={partyId} status="Suspended" />);
    await user.click(screen.getByRole('button', { name: /^activate$/i }));
    await waitFor(() => {
      expect(activateMutate).toHaveBeenCalledWith(partyId);
    });
  });

  it('requires confirmation before archiving', async () => {
    const { user } = renderWithProviders(<LifecycleActions partyId={partyId} status="Active" />);
    await user.click(screen.getByRole('button', { name: /^archive$/i }));

    expect(await screen.findByText('Archive this party?')).toBeInTheDocument();
    expect(archiveMutate).not.toHaveBeenCalled();

    const dialog = await screen.findByRole('alertdialog');
    const confirm = within(dialog).getByRole('button', { name: /^archive$/i });
    await user.click(confirm);

    await waitFor(() => {
      expect(archiveMutate).toHaveBeenCalledWith(partyId);
    });
  });
});
