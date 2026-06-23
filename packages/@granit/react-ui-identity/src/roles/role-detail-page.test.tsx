import { screen } from '@testing-library/react';

import { renderWithProviders } from '../__tests__/test-utils';

import { RoleDetailPage } from './role-detail-page';

import type { IdentityUser } from '@granit/identity';

// Stub useParams so the page resolves a role name.
const { mockUseParams } = vi.hoisted(() => ({
  mockUseParams: vi.fn(),
}));

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useParams: mockUseParams,
    useNavigate: () => vi.fn(),
  };
});

// Stub the identity data + mutation hooks.
const { mockUseRoleMembers, mockAssign, mockRemove } = vi.hoisted(() => ({
  mockUseRoleMembers: vi.fn(),
  mockAssign: { mutate: vi.fn(), isPending: false },
  mockRemove: { mutate: vi.fn(), isPending: false },
}));

vi.mock('@granit/react-identity', () => ({
  useRoleMembers: mockUseRoleMembers,
  useAssignRole: () => mockAssign,
  useRemoveRole: () => mockRemove,
}));

// Control the permission gate without hitting the authorization API.
const { mockHasPermission } = vi.hoisted(() => ({
  mockHasPermission: vi.fn(() => true),
}));

vi.mock('@granit/react-authorization', () => ({
  usePermissions: () => ({ hasPermission: mockHasPermission }),
}));

// Avoid pulling the user-search data flow into this page test.
vi.mock('../components/user-search-combobox', () => ({
  UserSearchCombobox: () => <div data-testid="user-search-combobox" />,
}));

const mockMembers: IdentityUser[] = [
  {
    userId: 'user-1' as IdentityUser['userId'],
    username: 'jdoe',
    email: 'jane.doe@example.com',
    firstName: 'Jane',
    lastName: 'Doe',
    enabled: true,
    metadata: {},
  },
];

describe('RoleDetailPage', () => {
  beforeEach(() => {
    mockUseParams.mockReturnValue({ roleName: 'admin' });
    mockHasPermission.mockReturnValue(true);
  });

  afterEach(() => vi.clearAllMocks());

  it('renders the role title with the route param', () => {
    mockUseRoleMembers.mockReturnValue({ data: mockMembers, isLoading: false, error: null });
    renderWithProviders(<RoleDetailPage />, { route: '/identity/roles/admin' });
    expect(screen.getByText('Role: admin')).toBeInTheDocument();
    expect(document.querySelector('[data-slot="role-detail-page"]')).toBeInTheDocument();
  });

  it('renders the member list', () => {
    mockUseRoleMembers.mockReturnValue({ data: mockMembers, isLoading: false, error: null });
    renderWithProviders(<RoleDetailPage />, { route: '/identity/roles/admin' });
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getByText('jane.doe@example.com')).toBeInTheDocument();
  });

  it('shows the member count', () => {
    mockUseRoleMembers.mockReturnValue({ data: mockMembers, isLoading: false, error: null });
    renderWithProviders(<RoleDetailPage />, { route: '/identity/roles/admin' });
    expect(screen.getByText('Members (1)')).toBeInTheDocument();
  });

  it('renders the assign action when the user can manage', () => {
    mockUseRoleMembers.mockReturnValue({ data: mockMembers, isLoading: false, error: null });
    renderWithProviders(<RoleDetailPage />, { route: '/identity/roles/admin' });
    expect(screen.getByRole('button', { name: 'Assign User' })).toBeInTheDocument();
  });

  it('hides the assign action when the user cannot manage', () => {
    mockHasPermission.mockReturnValue(false);
    mockUseRoleMembers.mockReturnValue({ data: mockMembers, isLoading: false, error: null });
    renderWithProviders(<RoleDetailPage />, { route: '/identity/roles/admin' });
    expect(screen.queryByRole('button', { name: 'Assign User' })).not.toBeInTheDocument();
  });

  it('renders the empty state when the role has no members', () => {
    mockUseRoleMembers.mockReturnValue({ data: [], isLoading: false, error: null });
    renderWithProviders(<RoleDetailPage />, { route: '/identity/roles/admin' });
    expect(screen.getByText('No users have this role')).toBeInTheDocument();
  });

  it('renders skeletons while loading', () => {
    mockUseRoleMembers.mockReturnValue({ data: undefined, isLoading: true, error: null });
    const { container } = renderWithProviders(<RoleDetailPage />, {
      route: '/identity/roles/admin',
    });
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
  });

  it('renders an error message on failure', () => {
    mockUseRoleMembers.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('boom'),
    });
    renderWithProviders(<RoleDetailPage />, { route: '/identity/roles/admin' });
    expect(screen.getByText('An error occurred')).toBeInTheDocument();
  });
});
