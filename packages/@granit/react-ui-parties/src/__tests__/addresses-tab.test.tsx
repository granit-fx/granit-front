import { sampleParty } from '@granit/react-parties/testing';
import { screen, waitFor } from '@testing-library/react';

import { AddressesTab } from '../components/addresses-tab';

import { renderWithProviders } from './test-utils';

import type { PartyAddressResponse } from '@granit/parties';

const { mockRemove, mockAdd, mockConfirm, mockHasPermission } = vi.hoisted(() => ({
  mockRemove: { mutateAsync: vi.fn(), isPending: false },
  mockAdd: { mutateAsync: vi.fn(), isPending: false },
  mockConfirm: { mutateAsync: vi.fn(), isPending: false },
  mockHasPermission: vi.fn(() => true),
}));

vi.mock('@granit/react-parties', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useRemovePartyAddressMutation: () => mockRemove,
    useAddPartyAddressMutation: () => mockAdd,
    useConfirmPartyAddressMutation: () => mockConfirm,
  };
});

vi.mock('@granit/react-authorization', () => ({
  usePermissions: () => ({ hasPermission: mockHasPermission }),
}));

const partyId = sampleParty.id;
const addresses = sampleParty.addresses as readonly PartyAddressResponse[];

describe('AddressesTab', () => {
  beforeEach(() => {
    mockRemove.mutateAsync.mockReset().mockResolvedValue(undefined);
    mockAdd.mutateAsync.mockReset().mockResolvedValue(undefined);
    mockConfirm.mutateAsync.mockReset().mockResolvedValue(sampleParty);
    mockHasPermission.mockReset().mockReturnValue(true);
  });

  it('renders the title and the address cards', () => {
    renderWithProviders(<AddressesTab partyId={partyId} addresses={addresses} />);
    expect(screen.getByText('Addresses')).toBeInTheDocument();
    expect(screen.getByText('1 rue de la Loi')).toBeInTheDocument();
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

  it('confirms an address deliverability when the user has the Confirm permission', async () => {
    const { user } = renderWithProviders(<AddressesTab partyId={partyId} addresses={addresses} />);
    await user.click(screen.getAllByRole('button', { name: 'Confirm deliverability' })[0]!);
    await waitFor(() => {
      expect(mockConfirm.mutateAsync).toHaveBeenCalledWith({
        id: partyId,
        addressId: addresses[0]!.id,
      });
    });
  });

  it('hides the confirm action without the Confirm permission', () => {
    mockHasPermission.mockReturnValue(false);
    renderWithProviders(<AddressesTab partyId={partyId} addresses={addresses} />);
    expect(
      screen.queryByRole('button', { name: 'Confirm deliverability' })
    ).not.toBeInTheDocument();
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
      request: { street1: string; country: string };
    };
    expect(call.request.street1).toBe('12 Main St');
    expect(call.request.country).toBe('BE');
  });
});
