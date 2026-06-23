import { screen, waitFor } from '@testing-library/react';

import { TaxStatusCard } from '../components/tax-status-card';

import { renderWithProviders } from './test-utils';

import type { PartyId, PartyTaxStatusResponse } from '@granit/parties';

const { mockClear, mockSet } = vi.hoisted(() => ({
  mockClear: { mutateAsync: vi.fn(), isPending: false },
  mockSet: { mutateAsync: vi.fn(), isPending: false },
}));

vi.mock('@granit/react-parties', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useClearPartyTaxStatusMutation: () => mockClear,
    useSetPartyTaxStatusMutation: () => mockSet,
  };
});

const partyId = 'party-1' as PartyId;
const standard: PartyTaxStatusResponse = {
  isExempt: false,
  reverseCharge: false,
  vatin: null,
  evidenceBlobId: null,
};
const exempt: PartyTaxStatusResponse = {
  isExempt: true,
  reverseCharge: false,
  vatin: 'BE0123456789',
  evidenceBlobId: null,
};

describe('TaxStatusCard', () => {
  beforeEach(() => {
    mockClear.mutateAsync.mockReset().mockResolvedValue(undefined);
    mockSet.mutateAsync.mockReset().mockResolvedValue(undefined);
  });

  it('renders the standard taxation state and disables reset', () => {
    renderWithProviders(<TaxStatusCard partyId={partyId} taxStatus={standard} />);
    expect(screen.getByText('Standard taxation')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reset' })).toBeDisabled();
  });

  it('renders the exempt badge and the VATIN', () => {
    renderWithProviders(<TaxStatusCard partyId={partyId} taxStatus={exempt} />);
    expect(screen.getByText('VAT exempt')).toBeInTheDocument();
    expect(screen.getByText('BE0123456789')).toBeInTheDocument();
  });

  it('clears the tax status via the mutation', async () => {
    const { user } = renderWithProviders(<TaxStatusCard partyId={partyId} taxStatus={exempt} />);
    await user.click(screen.getByRole('button', { name: 'Reset' }));
    await waitFor(() => {
      expect(mockClear.mutateAsync).toHaveBeenCalledWith(partyId);
    });
  });

  it('logs an error when clearing rejects', async () => {
    mockClear.mutateAsync.mockRejectedValueOnce(new Error('boom'));
    const { user } = renderWithProviders(<TaxStatusCard partyId={partyId} taxStatus={exempt} />);
    await user.click(screen.getByRole('button', { name: 'Reset' }));
    await waitFor(() => {
      expect(mockClear.mutateAsync).toHaveBeenCalled();
    });
  });

  it('opens the edit dialog and saves new values', async () => {
    const { user } = renderWithProviders(<TaxStatusCard partyId={partyId} taxStatus={standard} />);
    await user.click(screen.getByRole('button', { name: 'Edit' }));
    expect(await screen.findByText('Edit tax status')).toBeInTheDocument();

    await user.click(screen.getByLabelText('VAT exempt'));
    await user.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => {
      expect(mockSet.mutateAsync).toHaveBeenCalledWith({
        id: partyId,
        request: { isExempt: true, reverseCharge: false, vatin: null, evidenceBlobId: null },
      });
    });
  });

  it('blocks saving when both exempt and reverse-charge are set', async () => {
    const { user } = renderWithProviders(<TaxStatusCard partyId={partyId} taxStatus={standard} />);
    await user.click(screen.getByRole('button', { name: 'Edit' }));
    await user.click(await screen.findByLabelText('VAT exempt'));
    await user.click(screen.getByLabelText('Reverse charge'));
    await user.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => {
      expect(mockSet.mutateAsync).not.toHaveBeenCalled();
    });
  });
});
