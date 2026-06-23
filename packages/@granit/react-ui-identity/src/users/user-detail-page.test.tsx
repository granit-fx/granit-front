import { screen, waitFor } from '@testing-library/react';

import { renderWithProviders } from '../__tests__/test-utils';

import { UserDetailPage } from './user-detail-page';

import type { AdminUser } from './types';

// Mock react-router-dom useParams
const { mockUseParams } = vi.hoisted(() => ({
  mockUseParams: vi.fn(),
}));

vi.mock('react-router-dom', async (importOriginal) => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useParams: mockUseParams,
  };
});

// Mock useProviderUser hook
const { mockUseProviderUser } = vi.hoisted(() => ({
  mockUseProviderUser: vi.fn(),
}));

// Stub the permission gate (the danger zone is gated on Identity.Cache.Manage).
vi.mock('@granit/react-authorization', () => ({
  usePermissions: () => ({ hasPermission: () => true }),
}));

// Mock @granit/react-identity hooks used by the page and child components
vi.mock('@granit/react-identity', () => ({
  useProviderUser: mockUseProviderUser,
  useSetUserEnabled: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateUser: () => ({ mutateAsync: vi.fn(), isPending: false }),
  usePasswordChangedAt: () => ({ data: null }),
  useRoles: () => ({ data: [], isLoading: false }),
  useUserRoles: () => ({ data: [], isLoading: false }),
  useGroups: () => ({ data: [], isLoading: false }),
  useUserGroups: () => ({ data: [], isLoading: false }),
  useAddUserToGroup: () => ({ mutate: vi.fn(), isPending: false }),
  useRemoveUserFromGroup: () => ({ mutate: vi.fn(), isPending: false }),
  useUserSessions: () => ({ data: [], isLoading: false }),
  useUserDevices: () => ({ data: [], isLoading: false }),
  useTerminateSession: () => ({ mutate: vi.fn(), isPending: false }),
  useTerminateAllSessions: () => ({ mutate: vi.fn(), isPending: false }),
  useSendPasswordResetEmail: () => ({ mutate: vi.fn(), isPending: false }),
  useSetTemporaryPassword: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useIdentityRgpd: () => ({ erase: { mutateAsync: vi.fn(), isPending: false } }),
}));

// The activity aside is host-supplied via a render-prop. A test stub stands in
// for the showcase's EntityTimeline so the aside wiring can still be asserted.
function renderActivityAside(userId: string) {
  return <div data-testid="entity-timeline" data-entity-type="User" data-entity-id={userId} />;
}

const mockUser: AdminUser = {
  userId: 'user-001',
  email: 'admin@example.com',
  firstName: 'Jean',
  lastName: 'Dupont',
  username: 'jdupont',
  enabled: true,
};

describe('UserDetailPage', () => {
  beforeEach(() => {
    mockUseParams.mockReturnValue({ id: 'user-001' });
    // DetailAsideLayout mounts the timeline only at the lg breakpoint
    // (matchMedia '(min-width: 1024px)'). Force desktop in jsdom.
    Object.defineProperty(globalThis, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: query.includes('min-width: 1024px'),
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  afterEach(() => vi.clearAllMocks());

  it('should display the loading spinner', () => {
    mockUseProviderUser.mockReturnValue({ data: undefined, isLoading: true, error: null });
    renderWithProviders(<UserDetailPage />, { route: '/identity/users/user-001' });
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('should display the error state when the user is not found', () => {
    mockUseProviderUser.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Not found'),
    });
    renderWithProviders(<UserDetailPage />, { route: '/identity/users/user-001' });
    expect(screen.getByText('User not found')).toBeInTheDocument();
  });

  it('should display the user information', () => {
    mockUseProviderUser.mockReturnValue({ data: mockUser, isLoading: false, error: null });
    renderWithProviders(<UserDetailPage />, { route: '/identity/users/user-001' });
    // Name and username appear in both header and info card
    expect(screen.getAllByText(/Jean/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('admin@example.com')).toBeInTheDocument();
    expect(screen.getAllByText('jdupont').length).toBeGreaterThanOrEqual(1);
  });

  it('should display the status badge', () => {
    mockUseProviderUser.mockReturnValue({ data: mockUser, isLoading: false, error: null });
    renderWithProviders(<UserDetailPage />, { route: '/identity/users/user-001' });
    // "Enabled" appears in Badge and StatusToggle
    expect(screen.getAllByText('Enabled').length).toBeGreaterThanOrEqual(1);
  });

  it('should display the back link to the list', () => {
    mockUseProviderUser.mockReturnValue({ data: mockUser, isLoading: false, error: null });
    renderWithProviders(<UserDetailPage />, { route: '/identity/users/user-001' });
    expect(screen.getByText('Back to users')).toBeInTheDocument();
  });

  it('renders the host-supplied activity aside with the user id', () => {
    mockUseProviderUser.mockReturnValue({ data: mockUser, isLoading: false, error: null });
    renderWithProviders(<UserDetailPage renderActivityAside={renderActivityAside} />, {
      route: '/identity/users/user-001',
    });
    const timeline = screen.getByTestId('entity-timeline');
    expect(timeline).toBeInTheDocument();
    expect(timeline).toHaveAttribute('data-entity-type', 'User');
    expect(timeline).toHaveAttribute('data-entity-id', 'user-001');
  });

  it('should display the management sections', () => {
    mockUseProviderUser.mockReturnValue({ data: mockUser, isLoading: false, error: null });
    renderWithProviders(<UserDetailPage />, { route: '/identity/users/user-001' });
    expect(screen.getByText('User Information')).toBeInTheDocument();
    expect(screen.getByText('Account Status')).toBeInTheDocument();
  });

  it('should display the disabled badge when user is disabled', () => {
    const disabledUser: AdminUser = { ...mockUser, enabled: false };
    mockUseProviderUser.mockReturnValue({ data: disabledUser, isLoading: false, error: null });
    renderWithProviders(<UserDetailPage />, { route: '/identity/users/user-001' });
    expect(screen.getAllByText('Disabled').length).toBeGreaterThanOrEqual(1);
  });

  it('should display the error state when user data is undefined without error', () => {
    mockUseProviderUser.mockReturnValue({ data: undefined, isLoading: false, error: null });
    renderWithProviders(<UserDetailPage />, { route: '/identity/users/user-001' });
    expect(screen.getByText('User not found')).toBeInTheDocument();
  });

  it('should show edit form when clicking the edit button', async () => {
    mockUseProviderUser.mockReturnValue({ data: mockUser, isLoading: false, error: null });
    const { user } = renderWithProviders(<UserDetailPage />, { route: '/identity/users/user-001' });

    const editButton = screen.getByText('Edit');
    await user.click(editButton);

    await waitFor(() => {
      expect(screen.getByLabelText('First Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Last Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
    });
  });

  it('should populate the edit form with user data', async () => {
    mockUseProviderUser.mockReturnValue({ data: mockUser, isLoading: false, error: null });
    const { user } = renderWithProviders(<UserDetailPage />, { route: '/identity/users/user-001' });

    await user.click(screen.getByText('Edit'));

    await waitFor(() => {
      expect(screen.getByLabelText('First Name')).toHaveValue('Jean');
      expect(screen.getByLabelText('Last Name')).toHaveValue('Dupont');
      expect(screen.getByLabelText('Email')).toHaveValue('admin@example.com');
    });
  });

  it('should cancel editing and return to view mode', async () => {
    mockUseProviderUser.mockReturnValue({ data: mockUser, isLoading: false, error: null });
    const { user } = renderWithProviders(<UserDetailPage />, { route: '/identity/users/user-001' });

    await user.click(screen.getByText('Edit'));
    await waitFor(() => {
      expect(screen.getByLabelText('First Name')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Cancel'));
    await waitFor(() => {
      expect(screen.queryByLabelText('First Name')).not.toBeInTheDocument();
    });
  });

  it('should display the password never changed message when no passwordChangedAt', () => {
    mockUseProviderUser.mockReturnValue({ data: mockUser, isLoading: false, error: null });
    renderWithProviders(<UserDetailPage />, { route: '/identity/users/user-001' });
    expect(screen.getByText('Never changed')).toBeInTheDocument();
  });

  it('should have the data-slot attribute on the page', () => {
    mockUseProviderUser.mockReturnValue({ data: mockUser, isLoading: false, error: null });
    renderWithProviders(<UserDetailPage />, { route: '/identity/users/user-001' });
    expect(document.querySelector('[data-slot="user-detail-page"]')).toBeInTheDocument();
  });
});
