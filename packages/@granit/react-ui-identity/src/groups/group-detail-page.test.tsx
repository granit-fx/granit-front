import { screen } from '@testing-library/react';

import { renderWithProviders } from '../__tests__/test-utils';

import { GroupDetailPage } from './group-detail-page';

import type { IdentityGroup } from '@granit/identity';

// Stub useParams so the page resolves a group id.
const { mockUseParams } = vi.hoisted(() => ({
  mockUseParams: vi.fn(),
}));

vi.mock('react-router', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useParams: mockUseParams,
    useNavigate: () => vi.fn(),
  };
});

// Stub the identity data + mutation hooks.
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

// Control the permission gate without hitting the authorization API.
const { mockHasPermission } = vi.hoisted(() => ({
  mockHasPermission: vi.fn(() => true),
}));

vi.mock('@granit/react-authorization', () => ({
  usePermissions: () => ({ hasPermission: mockHasPermission }),
}));

vi.mock('../components/user-search-combobox', () => ({
  UserSearchCombobox: () => <div data-testid="user-search-combobox" />,
}));

const mockGroups: IdentityGroup[] = [
  {
    id: 'grp-1',
    name: 'Administrators',
    path: '/administrators',
    subGroups: [
      { id: 'grp-1a', name: 'Super Admins', path: '/administrators/super', subGroups: [] },
    ],
  },
  { id: 'grp-2', name: 'Support', path: '/support', subGroups: [] },
];

describe('GroupDetailPage', () => {
  beforeEach(() => {
    mockUseParams.mockReturnValue({ groupId: 'grp-1' });
    mockHasPermission.mockReturnValue(true);
  });

  afterEach(() => vi.clearAllMocks());

  it('renders the group title and path', () => {
    mockUseGroups.mockReturnValue({ data: mockGroups, isLoading: false, error: null });
    renderWithProviders(<GroupDetailPage />, { route: '/identity/groups/grp-1' });
    expect(screen.getByText('Group: Administrators')).toBeInTheDocument();
    expect(screen.getByText('/administrators')).toBeInTheDocument();
    expect(document.querySelector('[data-slot="group-detail-page"]')).toBeInTheDocument();
  });

  it('resolves a nested sub-group by id', () => {
    mockUseParams.mockReturnValue({ groupId: 'grp-1a' });
    mockUseGroups.mockReturnValue({ data: mockGroups, isLoading: false, error: null });
    renderWithProviders(<GroupDetailPage />, { route: '/identity/groups/grp-1a' });
    expect(screen.getByText('Group: Super Admins')).toBeInTheDocument();
  });

  it('renders the empty members state (members start in local state)', () => {
    mockUseGroups.mockReturnValue({ data: mockGroups, isLoading: false, error: null });
    renderWithProviders(<GroupDetailPage />, { route: '/identity/groups/grp-1' });
    expect(screen.getByText('Members (0)')).toBeInTheDocument();
    expect(screen.getByText('No results found')).toBeInTheDocument();
  });

  it('renders the add-member action when the user can manage', () => {
    mockUseGroups.mockReturnValue({ data: mockGroups, isLoading: false, error: null });
    renderWithProviders(<GroupDetailPage />, { route: '/identity/groups/grp-1' });
    expect(screen.getByRole('button', { name: 'Add Member' })).toBeInTheDocument();
  });

  it('hides the add-member action when the user cannot manage', () => {
    mockHasPermission.mockReturnValue(false);
    mockUseGroups.mockReturnValue({ data: mockGroups, isLoading: false, error: null });
    renderWithProviders(<GroupDetailPage />, { route: '/identity/groups/grp-1' });
    expect(screen.queryByRole('button', { name: 'Add Member' })).not.toBeInTheDocument();
  });

  it('renders skeletons while loading', () => {
    mockUseGroups.mockReturnValue({ data: undefined, isLoading: true, error: null });
    const { container } = renderWithProviders(<GroupDetailPage />, {
      route: '/identity/groups/grp-1',
    });
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
  });

  it('renders the not-found state when the group id does not exist', () => {
    mockUseParams.mockReturnValue({ groupId: 'missing' });
    mockUseGroups.mockReturnValue({ data: mockGroups, isLoading: false, error: null });
    renderWithProviders(<GroupDetailPage />, { route: '/identity/groups/missing' });
    expect(screen.getByText('Group not found')).toBeInTheDocument();
  });

  it('renders the not-found state on fetch error', () => {
    mockUseGroups.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('boom'),
    });
    renderWithProviders(<GroupDetailPage />, { route: '/identity/groups/grp-1' });
    expect(screen.getByText('Group not found')).toBeInTheDocument();
  });
});
