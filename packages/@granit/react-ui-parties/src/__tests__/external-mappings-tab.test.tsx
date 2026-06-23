import { sampleParty } from '@granit/react-parties/testing';
import { screen, waitFor } from '@testing-library/react';

import { ExternalMappingsTab } from '../components/external-mappings-tab';

import { renderWithProviders } from './test-utils';

import type { PartyExternalMappingResponse } from '@granit/parties';

const { mockRemove, mockAdd } = vi.hoisted(() => ({
  mockRemove: { mutateAsync: vi.fn(), isPending: false },
  mockAdd: { mutateAsync: vi.fn(), isPending: false },
}));

vi.mock('@granit/react-parties', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useRemovePartyExternalMappingMutation: () => mockRemove,
    useAddPartyExternalMappingMutation: () => mockAdd,
  };
});

const partyId = sampleParty.id;
const mappings = sampleParty.externalMappings as readonly PartyExternalMappingResponse[];

describe('ExternalMappingsTab', () => {
  beforeEach(() => {
    mockRemove.mutateAsync.mockReset().mockResolvedValue(undefined);
    mockAdd.mutateAsync.mockReset().mockResolvedValue(undefined);
  });

  it('renders the title and the mapping list', () => {
    renderWithProviders(<ExternalMappingsTab partyId={partyId} mappings={mappings} />);
    expect(screen.getByText('External mappings')).toBeInTheDocument();
    expect(screen.getByText('stripe')).toBeInTheDocument();
    expect(screen.getByText('cus_AcmeBE')).toBeInTheDocument();
  });

  it('shows the empty state when there are no mappings', () => {
    renderWithProviders(<ExternalMappingsTab partyId={partyId} mappings={[]} />);
    expect(screen.getByText('No external mappings.')).toBeInTheDocument();
  });

  it('confirms then removes a mapping via the mutation', async () => {
    const { user } = renderWithProviders(
      <ExternalMappingsTab partyId={partyId} mappings={mappings} />
    );
    await user.click(screen.getAllByRole('button', { name: 'Delete' })[0]!);
    expect(await screen.findByText('Remove external mapping?')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Delete' }));
    await waitFor(() => {
      expect(mockRemove.mutateAsync).toHaveBeenCalledWith({
        id: partyId,
        providerName: 'stripe',
      });
    });
  });

  it('cancels the remove confirmation', async () => {
    const { user } = renderWithProviders(
      <ExternalMappingsTab partyId={partyId} mappings={mappings} />
    );
    await user.click(screen.getAllByRole('button', { name: 'Delete' })[0]!);
    await user.click(await screen.findByRole('button', { name: 'Cancel' }));
    await waitFor(() => {
      expect(screen.queryByText('Remove external mapping?')).not.toBeInTheDocument();
    });
    expect(mockRemove.mutateAsync).not.toHaveBeenCalled();
  });

  it('logs an error when the remove mutation rejects', async () => {
    mockRemove.mutateAsync.mockRejectedValueOnce(new Error('boom'));
    const { user } = renderWithProviders(
      <ExternalMappingsTab partyId={partyId} mappings={mappings} />
    );
    await user.click(screen.getAllByRole('button', { name: 'Delete' })[0]!);
    await user.click(await screen.findByRole('button', { name: 'Delete' }));
    await waitFor(() => {
      expect(mockRemove.mutateAsync).toHaveBeenCalled();
    });
  });

  it('opens and submits the add-mapping dialog with a lowercased provider', async () => {
    const { user } = renderWithProviders(<ExternalMappingsTab partyId={partyId} mappings={[]} />);
    await user.click(screen.getByRole('button', { name: 'Add mapping' }));
    await user.type(await screen.findByLabelText('Provider'), 'ODOO');
    await user.type(screen.getByLabelText('External ID'), 'res.partner/99');
    await user.click(screen.getByRole('button', { name: 'Add' }));
    await waitFor(() => {
      expect(mockAdd.mutateAsync).toHaveBeenCalledWith({
        id: partyId,
        request: { providerName: 'odoo', externalId: 'res.partner/99' },
      });
    });
  });
});
