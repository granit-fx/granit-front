import { sampleParty } from '@granit/react-parties/testing';
import { screen, waitFor } from '@testing-library/react';

import { PhonesTab } from '../components/phones-tab';

import { renderWithProviders } from './test-utils';

import type { PartyPhoneResponse } from '@granit/parties';

const { mockRemove, mockAdd } = vi.hoisted(() => ({
  mockRemove: { mutateAsync: vi.fn(), isPending: false },
  mockAdd: { mutateAsync: vi.fn(), isPending: false },
}));

vi.mock('@granit/react-parties', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useRemovePartyPhoneMutation: () => mockRemove,
    useAddPartyPhoneMutation: () => mockAdd,
  };
});

const partyId = sampleParty.id;
const phones = sampleParty.phones as readonly PartyPhoneResponse[];

describe('PhonesTab', () => {
  beforeEach(() => {
    mockRemove.mutateAsync.mockReset().mockResolvedValue(undefined);
    mockAdd.mutateAsync.mockReset().mockResolvedValue(undefined);
  });

  it('renders the title and the formatted phone numbers', () => {
    renderWithProviders(<PhonesTab partyId={partyId} phones={phones} />);
    expect(screen.getByText('Phones')).toBeInTheDocument();
    expect(screen.getByText('Work')).toBeInTheDocument();
    expect(screen.getByText('Primary')).toBeInTheDocument();
  });

  it('shows the empty state when there are no phones', () => {
    renderWithProviders(<PhonesTab partyId={partyId} phones={[]} />);
    expect(screen.getByText('No phone numbers on file.')).toBeInTheDocument();
  });

  it('removes a phone via the mutation', async () => {
    const { user } = renderWithProviders(<PhonesTab partyId={partyId} phones={phones} />);
    await user.click(screen.getByRole('button', { name: 'Delete' }));
    await waitFor(() => {
      expect(mockRemove.mutateAsync).toHaveBeenCalledWith({
        id: partyId,
        phoneId: phones[0]!.id,
      });
    });
  });

  it('logs an error when the remove mutation rejects', async () => {
    mockRemove.mutateAsync.mockRejectedValueOnce(new Error('boom'));
    const { user } = renderWithProviders(<PhonesTab partyId={partyId} phones={phones} />);
    await user.click(screen.getByRole('button', { name: 'Delete' }));
    await waitFor(() => {
      expect(mockRemove.mutateAsync).toHaveBeenCalled();
    });
  });

  it('opens the add-phone dialog', async () => {
    const { user } = renderWithProviders(<PhonesTab partyId={partyId} phones={phones} />);
    await user.click(screen.getByRole('button', { name: 'Add phone' }));
    expect(await screen.findByText('Add a new phone number for this party.')).toBeInTheDocument();
  });

  it('submits a new phone through the add dialog', async () => {
    const { user } = renderWithProviders(<PhonesTab partyId={partyId} phones={[]} />);
    await user.click(screen.getByRole('button', { name: 'Add phone' }));
    await user.type(await screen.findByLabelText('Phone number'), '+32479123456');
    await user.click(screen.getByRole('button', { name: 'Add' }));
    await waitFor(() => {
      expect(mockAdd.mutateAsync).toHaveBeenCalled();
    });
    const call = mockAdd.mutateAsync.mock.calls[0]![0] as {
      id: string;
      request: { kind: string; number: string };
    };
    expect(call.id).toBe(partyId);
    expect(call.request.kind).toBe('Work');
  });
});
