import { screen, waitFor } from '@testing-library/react';

import { renderWithProviders } from '../__tests__/test-utils';

import { GroupDetailPage } from './group-detail-page';

import type { IdentityGroup, IdentityUser } from '@granit/identity';

// Stub useParams/useNavigate so the page resolves a group id.
const { mockUseParams } = vi.hoisted(() => ({ mockUseParams: vi.fn() }));

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return { ...actual, useParams: mockUseParams, useNavigate: () => vi.fn() };
});

const { mockUseGroups, mockAdd, mockRemove } = vi.hoisted(() => ({
  mockUseGroups: vi.fn(),
  mockAdd: { mutate: vi.fn(), isPending: false },
  mockRemove: { mutate: vi.fn(), isPending: false },
}));

vi.mock('@granit/react-identity', () => ({
  useGroups: mockUseGroups,
  useAddUserToGroup: () => mockAdd,
  useRemoveUserFromGroup: () => mockRemove,
}));

const { mockHasPermission } = vi.hoisted(() => ({ mockHasPermission: vi.fn(() => true) }));

vi.mock('@granit/react-authorization', () => ({
  usePermissions: () => ({ hasPermission: mockHasPermission }),
}));

// A test double for the combobox: a button that selects a fixed user, so the
// page's add/remove member flow (local state, table, alert dialog) is exercised
// without driving the real cmdk lookup.
const candidate: IdentityUser = {
  userId: 'user-9' as IdentityUser['userId'],
  username: 'mlopez',
  email: 'maria.lopez@example.com',
  firstName: 'Maria',
  lastName: 'Lopez',
  enabled: true,
  metadata: {},
};

vi.mock('../components/user-search-combobox', () => ({
  UserSearchCombobox: ({ onSelect }: { readonly onSelect: (u: IdentityUser) => void }) => (
    <button type="button" data-testid="select-candidate" onClick={() => onSelect(candidate)}>
      pick candidate
    </button>
  ),
}));

const mockGroups: IdentityGroup[] = [
  { id: 'grp-1', name: 'Administrators', path: '/administrators', subGroups: [] },
];

describe('GroupDetailPage member management', () => {
  beforeEach(() => {
    mockUseParams.mockReturnValue({ groupId: 'grp-1' });
    mockHasPermission.mockReturnValue(true);
    mockAdd.isPending = false;
    mockRemove.isPending = false;
    // Add resolves via the onSuccess callback passed by the page.
    mockAdd.mutate.mockImplementation((_vars, opts) => opts?.onSuccess?.());
    mockRemove.mutate.mockImplementation((_vars, opts) => opts?.onSuccess?.());
    mockUseGroups.mockReturnValue({ data: mockGroups, isLoading: false, error: null });
  });

  afterEach(() => vi.clearAllMocks());

  it('adds a member to local state and renders it in the table', async () => {
    const { user } = renderWithProviders(<GroupDetailPage />, { route: '/identity/groups/grp-1' });

    await user.click(screen.getByRole('button', { name: 'Add Member' }));
    await user.click(await screen.findByTestId('select-candidate'));

    expect(mockAdd.mutate).toHaveBeenCalledWith(
      { userId: 'user-9', groupId: 'grp-1' },
      expect.any(Object)
    );
    await waitFor(() => {
      expect(screen.getByText('Maria Lopez')).toBeInTheDocument();
      expect(screen.getByText('maria.lopez@example.com')).toBeInTheDocument();
      expect(screen.getByText('Members (1)')).toBeInTheDocument();
    });
  });

  it('opens the remove confirmation and removes the member', async () => {
    const { user } = renderWithProviders(<GroupDetailPage />, { route: '/identity/groups/grp-1' });

    await user.click(screen.getByRole('button', { name: 'Add Member' }));
    await user.click(await screen.findByTestId('select-candidate'));
    await screen.findByText('Maria Lopez');

    await user.click(screen.getByRole('button', { name: 'Remove' }));

    // Confirm in the alert dialog.
    const confirm = await screen.findByRole('button', { name: 'Remove' });
    await user.click(confirm);

    expect(mockRemove.mutate).toHaveBeenCalledWith(
      { userId: 'user-9', groupId: 'grp-1' },
      expect.any(Object)
    );
    await waitFor(() => {
      expect(screen.queryByText('Maria Lopez')).not.toBeInTheDocument();
      expect(screen.getByText('Members (0)')).toBeInTheDocument();
    });
  });

  it('hides the remove action column when the user cannot manage', () => {
    mockHasPermission.mockReturnValue(false);
    renderWithProviders(<GroupDetailPage />, { route: '/identity/groups/grp-1' });
    expect(screen.queryByRole('button', { name: 'Add Member' })).not.toBeInTheDocument();
  });
});
