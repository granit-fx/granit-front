import { sampleParty } from '@granit/react-parties/testing';
import { screen, waitFor } from '@testing-library/react';

import { RolesTab } from '../components/roles-tab';

import { renderWithProviders } from './test-utils';

const { mockRemove, mockAdd } = vi.hoisted(() => ({
  mockRemove: { mutateAsync: vi.fn(), isPending: false },
  mockAdd: { mutateAsync: vi.fn(), isPending: false },
}));

vi.mock('@granit/react-parties', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useRemovePartyRoleMutation: () => mockRemove,
    useAddPartyRoleMutation: () => mockAdd,
  };
});

const partyId = sampleParty.id;

describe('RolesTab', () => {
  beforeEach(() => {
    mockRemove.mutateAsync.mockReset().mockResolvedValue(undefined);
    mockAdd.mutateAsync.mockReset().mockResolvedValue(undefined);
  });

  it('renders the assigned role badges', () => {
    renderWithProviders(<RolesTab partyId={partyId} roles="Customer, Supplier" />);
    expect(screen.getByText('Roles')).toBeInTheDocument();
    expect(screen.getByText('Customer')).toBeInTheDocument();
    expect(screen.getByText('Supplier')).toBeInTheDocument();
  });

  it('shows the empty state when no roles are assigned', () => {
    renderWithProviders(<RolesTab partyId={partyId} roles="" />);
    expect(screen.getByText('No roles assigned.')).toBeInTheDocument();
  });

  it('disables the add button when all roles are assigned', () => {
    renderWithProviders(<RolesTab partyId={partyId} roles="Customer, Supplier, Employee, Lead" />);
    expect(screen.getByRole('button', { name: 'Add role' })).toBeDisabled();
  });

  it('removes a role via the mutation', async () => {
    const { user } = renderWithProviders(<RolesTab partyId={partyId} roles="Customer" />);
    await user.click(screen.getByRole('button', { name: 'Delete' }));
    await waitFor(() => {
      expect(mockRemove.mutateAsync).toHaveBeenCalledWith({ id: partyId, role: 'Customer' });
    });
  });

  it('logs an error when the remove mutation rejects', async () => {
    mockRemove.mutateAsync.mockRejectedValueOnce(new Error('boom'));
    const { user } = renderWithProviders(<RolesTab partyId={partyId} roles="Customer" />);
    await user.click(screen.getByRole('button', { name: 'Delete' }));
    await waitFor(() => {
      expect(mockRemove.mutateAsync).toHaveBeenCalled();
    });
  });

  it('opens the add-role dialog', async () => {
    const { user } = renderWithProviders(<RolesTab partyId={partyId} roles="Customer" />);
    await user.click(screen.getByRole('button', { name: 'Add role' }));
    expect(await screen.findByText('Grant a new business role to this party.')).toBeInTheDocument();
  });
});
