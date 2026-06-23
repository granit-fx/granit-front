import { screen, waitFor } from '@testing-library/react';

import { renderWithProviders } from '../__tests__/test-utils';

import { UserDetailPage } from './user-detail-page';

import type { AdminUser } from './types';

const { mockUseParams } = vi.hoisted(() => ({ mockUseParams: vi.fn() }));

vi.mock('react-router-dom', async (importOriginal) => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useParams: mockUseParams };
});

const {
  mockUseProviderUser,
  mockSetEnabled,
  mockUpdateUser,
  mockErase,
  toastSuccess,
  mockHasPermission,
} = vi.hoisted(() => ({
  mockUseProviderUser: vi.fn(),
  mockSetEnabled: { mutateAsync: vi.fn(), isPending: false },
  mockUpdateUser: { mutateAsync: vi.fn(), isPending: false },
  mockErase: { mutateAsync: vi.fn(), isPending: false },
  toastSuccess: vi.fn(),
  mockHasPermission: vi.fn(() => true),
}));

vi.mock('sonner', () => ({ toast: { success: toastSuccess } }));

vi.mock('@granit/react-authorization', () => ({
  usePermissions: () => ({ hasPermission: mockHasPermission }),
}));

vi.mock('@granit/react-identity', () => ({
  useProviderUser: mockUseProviderUser,
  useSetUserEnabled: () => mockSetEnabled,
  useUpdateUser: () => mockUpdateUser,
  usePasswordChangedAt: () => ({ data: { changedAt: '2026-01-01T00:00:00Z' } }),
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
  useIdentityRgpd: () => ({ erase: mockErase }),
}));

const mockUser: AdminUser = {
  userId: 'user-001',
  email: 'admin@example.com',
  firstName: 'Jean',
  lastName: 'Dupont',
  username: 'jdupont',
  enabled: true,
};

function forceDesktop() {
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
}

describe('UserDetailPage actions', () => {
  beforeEach(() => {
    mockUseParams.mockReturnValue({ id: 'user-001' });
    mockHasPermission.mockReturnValue(true);
    mockSetEnabled.isPending = false;
    mockUpdateUser.isPending = false;
    mockErase.isPending = false;
    mockSetEnabled.mutateAsync.mockResolvedValue({});
    mockUpdateUser.mutateAsync.mockResolvedValue({});
    mockErase.mutateAsync.mockResolvedValue({});
    mockUseProviderUser.mockReturnValue({ data: mockUser, isLoading: false, error: null });
    forceDesktop();
  });

  afterEach(() => vi.clearAllMocks());

  it('formats the password-changed timestamp when available', () => {
    renderWithProviders(<UserDetailPage />, { route: '/identity/users/user-001' });
    expect(screen.queryByText('Never changed')).not.toBeInTheDocument();
  });

  it('saves the edited profile and returns to view mode', async () => {
    const { user } = renderWithProviders(<UserDetailPage />, {
      route: '/identity/users/user-001',
    });

    await user.click(screen.getByText('Edit'));
    const firstName = await screen.findByLabelText('First Name');
    await user.clear(firstName);
    await user.type(firstName, 'Jeanne');
    await user.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(mockUpdateUser.mutateAsync).toHaveBeenCalledWith({
        userId: 'user-001',
        request: { firstName: 'Jeanne', lastName: 'Dupont', email: 'admin@example.com' },
      });
    });
    await waitFor(() => {
      expect(screen.queryByLabelText('First Name')).not.toBeInTheDocument();
    });
  });

  it('toggles the account status via the status toggle', async () => {
    const { user } = renderWithProviders(<UserDetailPage />, {
      route: '/identity/users/user-001',
    });
    // The toggle renders a switch; clicking it flips enabled.
    await user.click(screen.getByRole('switch'));
    await waitFor(() => {
      expect(mockSetEnabled.mutateAsync).toHaveBeenCalledWith({
        userId: 'user-001',
        enabled: false,
      });
    });
  });

  it('shows the RGPD danger zone and erases the cache after confirmation', async () => {
    const { user } = renderWithProviders(<UserDetailPage />, {
      route: '/identity/users/user-001',
    });

    expect(screen.getByText('Danger zone')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Erase cache/i }));

    // Confirmation panel appears with the explicit erase action.
    const eraseNow = await screen.findByRole('button', { name: /Erase now/i });
    await user.click(eraseNow);

    await waitFor(() => {
      expect(mockErase.mutateAsync).toHaveBeenCalledWith('user-001');
      expect(toastSuccess).toHaveBeenCalledWith('User cache erased.');
    });
  });

  it('cancels the RGPD erase confirmation', async () => {
    const { user } = renderWithProviders(<UserDetailPage />, {
      route: '/identity/users/user-001',
    });

    await user.click(screen.getByRole('button', { name: /Erase cache/i }));
    await screen.findByRole('button', { name: /Erase now/i });
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /Erase now/i })).not.toBeInTheDocument();
    });
    expect(mockErase.mutateAsync).not.toHaveBeenCalled();
  });

  it('hides the RGPD danger zone when the user lacks cache-manage permission', () => {
    mockHasPermission.mockReturnValue(false);
    renderWithProviders(<UserDetailPage />, { route: '/identity/users/user-001' });
    expect(screen.queryByText('Danger zone')).not.toBeInTheDocument();
  });
});
