import { screen } from '@testing-library/react';

import { renderWithProviders } from '../../__tests__/test-utils';

import { UserGroupsEditor } from './user-groups-editor';

import type { UserId } from '@granit/types';

const { mockUseGroups, mockUseUserGroups, mockAdd, mockRemove, loggerError } = vi.hoisted(() => ({
  mockUseGroups: vi.fn(),
  mockUseUserGroups: vi.fn(),
  mockAdd: { mutate: vi.fn(), isPending: false },
  mockRemove: { mutate: vi.fn(), isPending: false },
  loggerError: vi.fn(),
}));

vi.mock('@granit/react-identity', () => ({
  useGroups: mockUseGroups,
  useUserGroups: mockUseUserGroups,
  useAddUserToGroup: () => mockAdd,
  useRemoveUserFromGroup: () => mockRemove,
}));

vi.mock('../../logger', () => ({
  logger: { error: loggerError },
}));

const userId = 'user-1' as UserId;

const allGroups = [
  { id: 'grp-1', name: 'Administrators', path: '/administrators', subGroups: [] },
  { id: 'grp-2', name: 'Support', subGroups: [] },
];

describe('UserGroupsEditor', () => {
  beforeEach(() => {
    mockAdd.isPending = false;
    mockRemove.isPending = false;
    mockUseGroups.mockReturnValue({ data: allGroups, isLoading: false });
    mockUseUserGroups.mockReturnValue({ data: [{ id: 'grp-1' }], isLoading: false });
  });

  afterEach(() => vi.clearAllMocks());

  it('renders the group checkboxes reflecting current membership', () => {
    renderWithProviders(<UserGroupsEditor userId={userId} />);
    expect(screen.getByText('Administrators')).toBeInTheDocument();
    expect(screen.getByText('/administrators')).toBeInTheDocument();
    expect(screen.getByText('Support')).toBeInTheDocument();
    // grp-1 is a current group → checked; grp-2 → unchecked.
    expect(screen.getByLabelText('Administrators')).toBeChecked();
    expect(screen.getByLabelText('Support')).not.toBeChecked();
  });

  it('renders skeletons while groups load', () => {
    mockUseGroups.mockReturnValue({ data: undefined, isLoading: true });
    mockUseUserGroups.mockReturnValue({ data: undefined, isLoading: true });
    const { container } = renderWithProviders(<UserGroupsEditor userId={userId} />);
    expect(container.querySelectorAll('.h-5').length).toBeGreaterThan(0);
    expect(screen.queryByText('Administrators')).not.toBeInTheDocument();
  });

  it('renders the empty state when there are no groups', () => {
    mockUseGroups.mockReturnValue({ data: [], isLoading: false });
    renderWithProviders(<UserGroupsEditor userId={userId} />);
    expect(screen.getByText('No groups available')).toBeInTheDocument();
  });

  it('adds the user to a group when checking an unchecked box', async () => {
    const { user } = renderWithProviders(<UserGroupsEditor userId={userId} />);
    await user.click(screen.getByLabelText('Support'));
    expect(mockAdd.mutate).toHaveBeenCalledWith({ userId, groupId: 'grp-2' });
  });

  it('removes the user from a group when unchecking a checked box', async () => {
    const { user } = renderWithProviders(<UserGroupsEditor userId={userId} />);
    await user.click(screen.getByLabelText('Administrators'));
    expect(mockRemove.mutate).toHaveBeenCalledWith({ userId, groupId: 'grp-1' });
  });

  it('disables the checkboxes while a mutation is pending', () => {
    mockAdd.isPending = true;
    renderWithProviders(<UserGroupsEditor userId={userId} />);
    expect(screen.getByLabelText('Support')).toBeDisabled();
  });

  it('logs an error and treats a non-array userGroups value as empty', () => {
    mockUseUserGroups.mockReturnValue({ data: { not: 'an array' }, isLoading: false });
    renderWithProviders(<UserGroupsEditor userId={userId} />);
    expect(loggerError).toHaveBeenCalledWith(
      '[UserGroupsEditor] useUserGroups returned a non-array value',
      expect.objectContaining({ userGroups: { not: 'an array' } })
    );
    // No membership → both unchecked.
    expect(screen.getByLabelText('Administrators')).not.toBeChecked();
  });
});
