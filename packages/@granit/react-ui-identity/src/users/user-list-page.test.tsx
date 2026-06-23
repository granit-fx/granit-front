import { mockUsers } from '@granit/react-identity/testing';
import { screen, waitFor } from '@testing-library/react';

import { renderWithProviders } from '../__tests__/test-utils';

import { UserListPage } from './user-list-page';

import type { IdentityUser } from '@granit/identity';
import type { ReactNode } from 'react';

// ---------------------------------------------------------------------------
// In-memory user dataset driving useProviderUsers. The page debounces search
// (300ms) and pages in blocks of PAGE_SIZE (20); the mock mirrors the provider
// contract (filter by search, slice by first/max) so the search/pagination/empty
// assertions exercise the page logic without a server.
// ---------------------------------------------------------------------------

const PAGE_SIZE = 20;

function toIdentityUser(u: (typeof mockUsers)[number]): IdentityUser {
  return {
    userId: u.userId,
    username: u.username,
    email: u.email,
    firstName: u.firstName,
    lastName: u.lastName,
    enabled: u.enabled,
    metadata: {},
  };
}

function makeUser(index: number): IdentityUser {
  return {
    userId: `user-gen-${index}`,
    email: `user${index}@granit-showcase.local`,
    firstName: `First${index}`,
    lastName: `Last${index}`,
    username: `user${index}`,
    enabled: true,
    metadata: {},
  };
}

let dataset: IdentityUser[] = mockUsers.map(toIdentityUser);

function selectUsers(params?: { search?: string; first?: number; max?: number }): IdentityUser[] {
  const search = params?.search?.toLowerCase();
  const first = params?.first ?? 0;
  const max = params?.max ?? PAGE_SIZE;
  let filtered = dataset;
  if (search) {
    filtered = dataset.filter(
      (u) =>
        u.username?.toLowerCase().includes(search) ||
        u.email?.toLowerCase().includes(search) ||
        u.firstName?.toLowerCase().includes(search) ||
        u.lastName?.toLowerCase().includes(search)
    );
  }
  return filtered.slice(first, first + max);
}

let loadingForever = false;

vi.mock('@granit/react-authorization', () => ({
  usePermissions: () => ({ hasPermission: () => true }),
}));

vi.mock('@granit/react-identity', () => ({
  useProviderUsers: (params?: { search?: string; first?: number; max?: number }) => {
    if (loadingForever) return { data: undefined, isLoading: true, error: null };
    return { data: selectUsers(params), isLoading: false, error: null };
  },
  useCreateUser: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

// Pass-through provider + noop data-exchange hooks (dialogs are closed by default).
vi.mock('@granit/react-data-exchange', () => ({
  DataExchangeProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock('@granit/react-ui-data-exchange', () => ({
  ExportButton: ({ label, onExport }: { label: string; onExport: () => void }) => (
    <button onClick={onExport}>{label}</button>
  ),
  ImportButton: ({ label, onImport }: { label: string; onImport: () => void }) => (
    <button onClick={onImport}>{label}</button>
  ),
  ExportDialog: () => null,
  ImportDialog: () => null,
}));

describe('UserListPage', () => {
  beforeEach(() => {
    dataset = mockUsers.map(toIdentityUser);
    loadingForever = false;
  });

  afterEach(() => vi.clearAllMocks());

  it('should render page title', () => {
    renderWithProviders(<UserListPage />);
    expect(screen.getByText('User Management')).toBeInTheDocument();
  });

  it('should render search input', () => {
    renderWithProviders(<UserListPage />);
    expect(screen.getByRole('searchbox')).toBeInTheDocument();
  });

  it('should show users after loading', async () => {
    renderWithProviders(<UserListPage />);
    await waitFor(() => {
      expect(screen.getByText('marie.dupont@granit-showcase.local')).toBeInTheDocument();
    });
  });

  it('should show pagination info after loading', async () => {
    renderWithProviders(<UserListPage />);
    await waitFor(() => {
      expect(screen.getByText(/Showing/)).toBeInTheDocument();
    });
  });

  it('should show subtitle text', () => {
    renderWithProviders(<UserListPage />);
    expect(screen.getByText('Manage platform users, roles and access')).toBeInTheDocument();
  });

  it('should render export and import buttons', () => {
    renderWithProviders(<UserListPage />);
    expect(screen.getByText('Export')).toBeInTheDocument();
    expect(screen.getByText('Import')).toBeInTheDocument();
  });

  describe('search', () => {
    it('should filter users when typing in search input', async () => {
      const { user } = renderWithProviders(<UserListPage />);

      await waitFor(() => {
        expect(screen.getByText('marie.dupont@granit-showcase.local')).toBeInTheDocument();
      });

      await user.type(screen.getByRole('searchbox'), 'sophie');

      await waitFor(() => {
        expect(screen.getByText('sophie.bernard@granit-showcase.local')).toBeInTheDocument();
      });
      await waitFor(() => {
        expect(screen.queryByText('marie.dupont@granit-showcase.local')).not.toBeInTheDocument();
      });
    });

    it('should update search input value when typing', async () => {
      const { user } = renderWithProviders(<UserListPage />);
      const searchInput = screen.getByRole('searchbox');
      await user.type(searchInput, 'test query');
      expect(searchInput).toHaveValue('test query');
    });

    it('should have correct placeholder text', () => {
      renderWithProviders(<UserListPage />);
      expect(screen.getByRole('searchbox')).toHaveAttribute('placeholder', 'Search or filter...');
    });
  });

  describe('loading state', () => {
    beforeEach(() => {
      loadingForever = true;
    });

    it('should not show user data while loading', () => {
      renderWithProviders(<UserListPage />);
      expect(screen.queryByText('marie.dupont@granit-showcase.local')).not.toBeInTheDocument();
    });

    it('should not show pagination info while loading', () => {
      renderWithProviders(<UserListPage />);
      expect(screen.queryByText(/Showing/)).not.toBeInTheDocument();
    });

    it('should not show pagination buttons while loading', () => {
      renderWithProviders(<UserListPage />);
      expect(screen.queryByText('Previous')).not.toBeInTheDocument();
      expect(screen.queryByText('Next')).not.toBeInTheDocument();
    });
  });

  describe('empty state', () => {
    it('should show empty message when no users match search', async () => {
      const { user } = renderWithProviders(<UserListPage />);

      await waitFor(() => {
        expect(screen.getByText('marie.dupont@granit-showcase.local')).toBeInTheDocument();
      });

      await user.type(screen.getByRole('searchbox'), 'zzzznonexistent');

      await waitFor(() => {
        expect(screen.getByText('No users found')).toBeInTheDocument();
      });
    });

    it('should show empty message when there are no users', async () => {
      dataset = [];
      renderWithProviders(<UserListPage />);
      await waitFor(() => {
        expect(screen.getByText('No users found')).toBeInTheDocument();
      });
    });
  });

  describe('pagination', () => {
    beforeEach(() => {
      dataset = Array.from({ length: 45 }, (_, i) => makeUser(i + 1));
    });

    it('should show pagination buttons when there are more users than page size', async () => {
      renderWithProviders(<UserListPage />);
      await waitFor(() => {
        expect(screen.getByText('Previous')).toBeInTheDocument();
        expect(screen.getByText('Next')).toBeInTheDocument();
      });
    });

    it('should show page info text', async () => {
      renderWithProviders(<UserListPage />);
      await waitFor(() => {
        expect(screen.getByText('1 / 2')).toBeInTheDocument();
      });
    });

    it('should disable Previous button on first page', async () => {
      renderWithProviders(<UserListPage />);
      await waitFor(() => {
        expect(screen.getByText('Previous')).toBeDisabled();
      });
    });

    it('should enable Next button on first page', async () => {
      renderWithProviders(<UserListPage />);
      await waitFor(() => {
        expect(screen.getByText('Next')).toBeEnabled();
      });
    });

    it('should navigate to next page when clicking Next', async () => {
      const { user } = renderWithProviders(<UserListPage />);

      await waitFor(() => {
        expect(screen.getByText('1 / 2')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Next'));

      await waitFor(() => {
        expect(screen.getByText('2 / 2')).toBeInTheDocument();
      });
    });

    it('should enable Previous button on page 2', async () => {
      const { user } = renderWithProviders(<UserListPage />);

      await waitFor(() => {
        expect(screen.getByText('Previous')).toBeDisabled();
      });

      await user.click(screen.getByText('Next'));

      await waitFor(() => {
        expect(screen.getByText('Previous')).toBeEnabled();
      });
    });

    it('should show correct showing info on page 1', async () => {
      renderWithProviders(<UserListPage />);
      await waitFor(() => {
        expect(screen.getByText('Showing 1-20 of 20')).toBeInTheDocument();
      });
    });

    it('should not show pagination buttons when all users fit on one page', async () => {
      dataset = mockUsers.map(toIdentityUser);
      renderWithProviders(<UserListPage />);

      await waitFor(() => {
        expect(screen.getByText('marie.dupont@granit-showcase.local')).toBeInTheDocument();
      });

      expect(screen.queryByText('Previous')).not.toBeInTheDocument();
      expect(screen.queryByText('Next')).not.toBeInTheDocument();
    });
  });
});
