import { sampleParty } from '@granit/react-parties/testing';
import { screen, waitFor } from '@testing-library/react';

import { EmailsTab } from '../components/emails-tab';

import { renderWithProviders } from './test-utils';

import type { PartyEmailResponse } from '@granit/parties';

const { mockRemove, mockAdd } = vi.hoisted(() => ({
  mockRemove: { mutateAsync: vi.fn(), isPending: false },
  mockAdd: { mutateAsync: vi.fn(), isPending: false },
}));

vi.mock('@granit/react-parties', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useRemovePartyEmailMutation: () => mockRemove,
    useAddPartyEmailMutation: () => mockAdd,
  };
});

const partyId = sampleParty.id;
const emails = sampleParty.emails as readonly PartyEmailResponse[];

describe('EmailsTab', () => {
  beforeEach(() => {
    mockRemove.mutateAsync.mockReset().mockResolvedValue(undefined);
    mockAdd.mutateAsync.mockReset().mockResolvedValue(undefined);
  });

  it('renders the title and the list of emails', () => {
    renderWithProviders(<EmailsTab partyId={partyId} emails={emails} />);
    expect(screen.getByText('Emails')).toBeInTheDocument();
    expect(screen.getByText('billing@acme.example')).toBeInTheDocument();
    expect(screen.getByText('support@acme.example')).toBeInTheDocument();
    expect(screen.getByText('Primary')).toBeInTheDocument();
    expect(screen.getByText('Billing')).toBeInTheDocument();
  });

  it('shows the empty state when there are no emails', () => {
    renderWithProviders(<EmailsTab partyId={partyId} emails={[]} />);
    expect(screen.getByText('No email addresses on file.')).toBeInTheDocument();
  });

  it('removes an email via the mutation', async () => {
    const { user } = renderWithProviders(<EmailsTab partyId={partyId} emails={emails} />);
    const removeButtons = screen.getAllByRole('button', { name: 'Delete' });
    await user.click(removeButtons[0]!);
    await waitFor(() => {
      expect(mockRemove.mutateAsync).toHaveBeenCalledWith({
        id: partyId,
        emailId: emails[0]!.id,
      });
    });
  });

  it('logs an error when the remove mutation rejects', async () => {
    mockRemove.mutateAsync.mockRejectedValueOnce(new Error('boom'));
    const { user } = renderWithProviders(<EmailsTab partyId={partyId} emails={emails} />);
    await user.click(screen.getAllByRole('button', { name: 'Delete' })[0]!);
    await waitFor(() => {
      expect(mockRemove.mutateAsync).toHaveBeenCalled();
    });
  });

  it('opens the add-email dialog', async () => {
    const { user } = renderWithProviders(<EmailsTab partyId={partyId} emails={emails} />);
    await user.click(screen.getByRole('button', { name: 'Add email' }));
    expect(await screen.findByText('Add a new email address for this party.')).toBeInTheDocument();
  });

  it('submits a new email through the add dialog', async () => {
    const { user } = renderWithProviders(<EmailsTab partyId={partyId} emails={[]} />);
    await user.click(screen.getByRole('button', { name: 'Add email' }));
    await user.type(await screen.findByLabelText('Email'), 'new@acme.example');
    await user.click(screen.getByRole('button', { name: 'Add' }));
    await waitFor(() => {
      expect(mockAdd.mutateAsync).toHaveBeenCalledWith({
        id: partyId,
        request: { address: 'new@acme.example', label: null, isPrimary: false },
      });
    });
  });
});
