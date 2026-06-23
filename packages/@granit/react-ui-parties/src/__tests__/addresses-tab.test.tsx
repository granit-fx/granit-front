import { sampleParty } from '@granit/react-parties/testing';
import { screen, waitFor } from '@testing-library/react';

import { AddressesTab } from '../components/addresses-tab';

import { renderWithProviders } from './test-utils';

import type { PartyAddressResponse } from '@granit/parties';

const { mockRemove, mockAdd } = vi.hoisted(() => ({
  mockRemove: { mutateAsync: vi.fn(), isPending: false },
  mockAdd: { mutateAsync: vi.fn(), isPending: false },
}));

vi.mock('@granit/react-parties', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useRemovePartyAddressMutation: () => mockRemove,
    useAddPartyAddressMutation: () => mockAdd,
  };
});

const partyId = sampleParty.id;
const addresses = sampleParty.addresses as readonly PartyAddressResponse[];

describe('AddressesTab', () => {
  beforeEach(() => {
    mockRemove.mutateAsync.mockReset().mockResolvedValue(undefined);
    mockAdd.mutateAsync.mockReset().mockResolvedValue(undefined);
  });

  it('renders the title and the address cards', () => {
    renderWithProviders(<AddressesTab partyId={partyId} addresses={addresses} />);
    expect(screen.getByText('Addresses')).toBeInTheDocument();
    expect(screen.getByText('1 rue de la Loi')).toBeInTheDocument();
    expect(screen.getByText('Acme Corp SA')).toBeInTheDocument();
    expect(screen.getByText('Bât. 4')).toBeInTheDocument();
  });

  it('shows the empty state when there are no addresses', () => {
    renderWithProviders(<AddressesTab partyId={partyId} addresses={[]} />);
    expect(screen.getByText('No addresses on file.')).toBeInTheDocument();
  });

  it('removes an address via the mutation', async () => {
    const { user } = renderWithProviders(<AddressesTab partyId={partyId} addresses={addresses} />);
    await user.click(screen.getAllByRole('button', { name: 'Delete' })[0]!);
    await waitFor(() => {
      expect(mockRemove.mutateAsync).toHaveBeenCalledWith({
        id: partyId,
        addressId: addresses[0]!.id,
      });
    });
  });

  it('logs an error when the remove mutation rejects', async () => {
    mockRemove.mutateAsync.mockRejectedValueOnce(new Error('boom'));
    const { user } = renderWithProviders(<AddressesTab partyId={partyId} addresses={addresses} />);
    await user.click(screen.getAllByRole('button', { name: 'Delete' })[0]!);
    await waitFor(() => {
      expect(mockRemove.mutateAsync).toHaveBeenCalled();
    });
  });

  it('opens the add-address dialog', async () => {
    const { user } = renderWithProviders(<AddressesTab partyId={partyId} addresses={addresses} />);
    await user.click(screen.getByRole('button', { name: 'Add address' }));
    expect(await screen.findByText('Add a new postal address for this party.')).toBeInTheDocument();
  });

  it('submits a new address through the add dialog', async () => {
    const { user } = renderWithProviders(<AddressesTab partyId={partyId} addresses={[]} />);
    await user.click(screen.getByRole('button', { name: 'Add address' }));
    await user.type(await screen.findByLabelText('Address line 1'), '12 Main St');
    await user.type(screen.getByLabelText('Postal code'), '1000');
    await user.type(screen.getByLabelText('City'), 'Brussels');
    await user.click(screen.getByRole('button', { name: 'Add' }));
    await waitFor(() => {
      expect(mockAdd.mutateAsync).toHaveBeenCalled();
    });
    const call = mockAdd.mutateAsync.mock.calls[0]![0] as {
      request: { line1: string; country: string };
    };
    expect(call.request.line1).toBe('12 Main St');
    expect(call.request.country).toBe('BE');
  });
});
