import { screen, waitFor } from '@testing-library/react';

import { renderWithProviders } from '../__tests__/test-utils';

import { UserSearchCombobox } from './user-search-combobox';

import type { IdentityUser } from '@granit/identity';

const { mockUseProviderUsers } = vi.hoisted(() => ({
  mockUseProviderUsers: vi.fn(),
}));

vi.mock('@granit/react-identity', () => ({
  useProviderUsers: mockUseProviderUsers,
}));

const users: IdentityUser[] = [
  {
    userId: 'user-1' as IdentityUser['userId'],
    username: 'jdoe',
    email: 'jane.doe@example.com',
    firstName: 'Jane',
    lastName: 'Doe',
    enabled: true,
    metadata: {},
  },
  {
    userId: 'user-2' as IdentityUser['userId'],
    username: 'bsmith',
    email: 'bob.smith@example.com',
    firstName: 'Bob',
    lastName: 'Smith',
    enabled: true,
    metadata: {},
  },
];

describe('UserSearchCombobox', () => {
  beforeEach(() => {
    mockUseProviderUsers.mockReturnValue({ data: undefined, isLoading: false });
  });

  afterEach(() => vi.clearAllMocks());

  it('renders with the default placeholder and the search container slot', () => {
    renderWithProviders(<UserSearchCombobox onSelect={vi.fn()} />);
    expect(screen.getByPlaceholderText('Search users...')).toBeInTheDocument();
    expect(document.querySelector('[data-slot="user-search-combobox"]')).toBeInTheDocument();
  });

  it('renders a custom placeholder when provided', () => {
    renderWithProviders(<UserSearchCombobox onSelect={vi.fn()} placeholder="Find someone" />);
    expect(screen.getByPlaceholderText('Find someone')).toBeInTheDocument();
  });

  it('does not query the lookup for queries shorter than 2 characters', async () => {
    const { user } = renderWithProviders(<UserSearchCombobox onSelect={vi.fn()} />);
    await user.type(screen.getByPlaceholderText('Search users...'), 'a');
    // The hook is always invoked, but with `undefined` (disabled) below the threshold.
    expect(mockUseProviderUsers).toHaveBeenLastCalledWith(undefined);
  });

  it('queries the lookup once the query reaches the threshold', async () => {
    const { user } = renderWithProviders(<UserSearchCombobox onSelect={vi.fn()} />);
    await user.type(screen.getByPlaceholderText('Search users...'), 'ja');
    await waitFor(() => {
      expect(mockUseProviderUsers).toHaveBeenLastCalledWith({ search: 'ja', max: 10 });
    });
  });

  it('shows the loading state while fetching a 2+ char query', async () => {
    mockUseProviderUsers.mockReturnValue({ data: undefined, isLoading: true });
    const { user } = renderWithProviders(<UserSearchCombobox onSelect={vi.fn()} />);
    await user.type(screen.getByPlaceholderText('Search users...'), 'ja');
    await waitFor(() => {
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  it('shows the empty state when a 2+ char query returns no users', async () => {
    mockUseProviderUsers.mockReturnValue({ data: [], isLoading: false });
    const { user } = renderWithProviders(<UserSearchCombobox onSelect={vi.fn()} />);
    await user.type(screen.getByPlaceholderText('Search users...'), 'zz');
    await waitFor(() => {
      expect(screen.getByText('No results found')).toBeInTheDocument();
    });
  });

  it('renders the matching users and selects one on click', async () => {
    mockUseProviderUsers.mockReturnValue({ data: users, isLoading: false });
    const onSelect = vi.fn();
    const { user } = renderWithProviders(<UserSearchCombobox onSelect={onSelect} />);
    await user.type(screen.getByPlaceholderText('Search users...'), 'ja');

    expect(await screen.findByText('jane.doe@example.com')).toBeInTheDocument();
    await user.click(screen.getByText('jane.doe@example.com'));
    expect(onSelect).toHaveBeenCalledWith(users[0]);
  });

  it('excludes users listed in excludeUserIds', async () => {
    mockUseProviderUsers.mockReturnValue({ data: users, isLoading: false });
    const { user } = renderWithProviders(
      <UserSearchCombobox onSelect={vi.fn()} excludeUserIds={['user-1']} />
    );
    await user.type(screen.getByPlaceholderText('Search users...'), 'ja');

    expect(await screen.findByText('bob.smith@example.com')).toBeInTheDocument();
    expect(screen.queryByText('jane.doe@example.com')).not.toBeInTheDocument();
  });
});
