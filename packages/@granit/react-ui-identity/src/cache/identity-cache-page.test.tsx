import { screen } from '@testing-library/react';

import { renderWithProviders } from '../__tests__/test-utils';

import { IdentityCachePage } from './identity-cache-page';

import type {
  IdentityProviderCapabilitiesResponse,
  IdentityUser,
  IdentityUserCacheStats,
  IdentityUserPage,
} from '@granit/identity';

const { mockUseCapabilities, mockUseCacheStats, mockUseSync, mockUseUsers } = vi.hoisted(() => ({
  mockUseCapabilities: vi.fn(),
  mockUseCacheStats: vi.fn(),
  mockUseSync: vi.fn(),
  mockUseUsers: vi.fn(),
}));

vi.mock('@granit/react-identity', () => ({
  useIdentityCapabilities: mockUseCapabilities,
  useIdentityCacheStats: mockUseCacheStats,
  useIdentitySync: mockUseSync,
  useIdentityUsers: mockUseUsers,
}));

const capabilities: IdentityProviderCapabilitiesResponse = {
  providerName: 'Keycloak',
  supportsIndividualSessionTermination: true,
  supportsNativePasswordResetEmail: true,
  supportsGroupHierarchy: true,
  supportsCustomAttributes: true,
  maxCustomAttributes: 20,
  supportsCredentialVerification: true,
  supportsUserCreation: true,
  supportsGroupManagement: true,
};

const cacheStats: IdentityUserCacheStats = {
  totalEntries: 42,
  staleEntries: 3,
  oldestSyncAt: '2026-01-01T00:00:00Z' as IdentityUserCacheStats['oldestSyncAt'],
  newestSyncAt: '2026-06-01T00:00:00Z' as IdentityUserCacheStats['newestSyncAt'],
};

const usersPage: IdentityUserPage = {
  items: [
    {
      userId: 'user-1' as IdentityUser['userId'],
      username: 'jdoe',
      email: 'jane.doe@example.com',
      firstName: 'Jane',
      lastName: 'Doe',
      enabled: true,
      metadata: {},
    },
  ],
  totalCount: 1,
  hasMore: false,
};

function syncHooks() {
  return {
    sync: { mutateAsync: vi.fn(), isPending: false },
    syncAll: { mutateAsync: vi.fn(), isPending: false },
    syncStale: { mutateAsync: vi.fn(), isPending: false },
  };
}

describe('IdentityCachePage', () => {
  beforeEach(() => {
    mockUseCapabilities.mockReturnValue({ data: capabilities });
    mockUseCacheStats.mockReturnValue({ data: cacheStats, isLoading: false });
    mockUseSync.mockReturnValue(syncHooks());
    mockUseUsers.mockReturnValue({ data: undefined, isLoading: false });
  });

  afterEach(() => vi.clearAllMocks());

  it('renders the title and subtitle', () => {
    renderWithProviders(<IdentityCachePage />);
    expect(screen.getByText('Identity cache')).toBeInTheDocument();
    expect(
      screen.getByText('Manage the identity user cache and sync with the provider')
    ).toBeInTheDocument();
    expect(document.querySelector('[data-slot="identity-cache-page"]')).toBeInTheDocument();
  });

  it('renders the provider badge', () => {
    renderWithProviders(<IdentityCachePage />);
    expect(screen.getByText('Keycloak')).toBeInTheDocument();
  });

  it('renders the cache statistics', () => {
    renderWithProviders(<IdentityCachePage />);
    expect(screen.getByText('Total entries')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('Stale entries')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('Oldest sync')).toBeInTheDocument();
    expect(screen.getByText('Newest sync')).toBeInTheDocument();
  });

  it('renders the sync action cards', () => {
    renderWithProviders(<IdentityCachePage />);
    expect(screen.getByText('Synchronize cache')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sync all/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sync stale/i })).toBeInTheDocument();
    expect(screen.getByText('Sync selected users')).toBeInTheDocument();
  });

  it('renders the user search input', () => {
    renderWithProviders(<IdentityCachePage />);
    expect(screen.getByPlaceholderText('Search or filter...')).toBeInTheDocument();
  });

  it('triggers a sync-all when the button is clicked', async () => {
    const hooks = syncHooks();
    mockUseSync.mockReturnValue(hooks);
    const { user } = renderWithProviders(<IdentityCachePage />);
    await user.click(screen.getByRole('button', { name: /Sync all/i }));
    expect(hooks.syncAll.mutateAsync).toHaveBeenCalled();
  });

  it('lists cached users matching a search', async () => {
    mockUseUsers.mockReturnValue({ data: usersPage, isLoading: false });
    const { user } = renderWithProviders(<IdentityCachePage />);
    await user.type(screen.getByPlaceholderText('Search or filter...'), 'jane');
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getByText('jane.doe@example.com')).toBeInTheDocument();
  });

  it('renders a spinner while stats are loading', () => {
    mockUseCacheStats.mockReturnValue({ data: undefined, isLoading: true });
    renderWithProviders(<IdentityCachePage />);
    expect(screen.queryByText('Total entries')).not.toBeInTheDocument();
  });
});
