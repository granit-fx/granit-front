import { screen, waitFor } from '@testing-library/react';

import { AddRoleDialog } from '../components/add-role-dialog';

import { renderWithProviders } from './test-utils';

import type { PartyId } from '@granit/parties';

const { mockAdd } = vi.hoisted(() => ({
  mockAdd: { mutateAsync: vi.fn(), isPending: false },
}));

vi.mock('@granit/react-parties', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useAddPartyRoleMutation: () => mockAdd,
  };
});

const partyId = 'party-1' as PartyId;

describe('AddRoleDialog', () => {
  beforeEach(() => {
    mockAdd.mutateAsync.mockReset().mockResolvedValue(undefined);
  });

  it('renders the dialog title when open', () => {
    renderWithProviders(
      <AddRoleDialog
        partyId={partyId}
        assignableRoles={['Customer', 'Supplier']}
        open
        onOpenChange={vi.fn()}
      />
    );
    expect(screen.getByText('Add role')).toBeInTheDocument();
  });

  it('disables the submit button until a role is selected', () => {
    renderWithProviders(
      <AddRoleDialog partyId={partyId} assignableRoles={['Customer']} open onOpenChange={vi.fn()} />
    );
    expect(screen.getByRole('button', { name: 'Add' })).toBeDisabled();
  });

  it('selects a role and submits the mutation', async () => {
    const onOpenChange = vi.fn();
    const { user } = renderWithProviders(
      <AddRoleDialog
        partyId={partyId}
        assignableRoles={['Customer', 'Supplier']}
        open
        onOpenChange={onOpenChange}
      />
    );
    await user.click(screen.getByRole('combobox', { name: 'Role' }));
    await user.click(await screen.findByRole('option', { name: 'Supplier' }));
    await user.click(screen.getByRole('button', { name: 'Add' }));
    await waitFor(() => {
      expect(mockAdd.mutateAsync).toHaveBeenCalledWith({
        id: partyId,
        request: { role: 'Supplier' },
      });
    });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('closes via the cancel button', async () => {
    const onOpenChange = vi.fn();
    const { user } = renderWithProviders(
      <AddRoleDialog
        partyId={partyId}
        assignableRoles={['Customer']}
        open
        onOpenChange={onOpenChange}
      />
    );
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('logs an error when the mutation rejects', async () => {
    mockAdd.mutateAsync.mockRejectedValueOnce(new Error('boom'));
    const { user } = renderWithProviders(
      <AddRoleDialog partyId={partyId} assignableRoles={['Customer']} open onOpenChange={vi.fn()} />
    );
    await user.click(screen.getByRole('combobox', { name: 'Role' }));
    await user.click(await screen.findByRole('option', { name: 'Customer' }));
    await user.click(screen.getByRole('button', { name: 'Add' }));
    await waitFor(() => {
      expect(mockAdd.mutateAsync).toHaveBeenCalled();
    });
  });

  it('falls back to all assignable roles when none are passed', async () => {
    const { user } = renderWithProviders(
      <AddRoleDialog partyId={partyId} assignableRoles={[]} open onOpenChange={vi.fn()} />
    );
    await user.click(screen.getByRole('combobox', { name: 'Role' }));
    expect(await screen.findByRole('option', { name: 'Employee' })).toBeInTheDocument();
  });
});
