import { screen } from '@testing-library/react';

import { renderWithProviders } from '../__tests__/test-utils';

import { RoleListPage } from './role-list-page';

import type { IdentityRole } from '@granit/identity';

const { mockUseRoles } = vi.hoisted(() => ({
  mockUseRoles: vi.fn(),
}));

vi.mock('@granit/react-identity', () => ({
  useRoles: mockUseRoles,
}));

const mockRoles: IdentityRole[] = [
  { id: 'role-1' as IdentityRole['id'], name: 'admin', description: 'Administrators' },
  { id: 'role-2' as IdentityRole['id'], name: 'support', description: null },
];

describe('RoleListPage', () => {
  afterEach(() => vi.clearAllMocks());

  it('renders the title and description', () => {
    mockUseRoles.mockReturnValue({ data: mockRoles, isLoading: false, error: null });
    renderWithProviders(<RoleListPage />);
    expect(screen.getByText('Roles')).toBeInTheDocument();
    expect(screen.getByText('Manage identity provider roles')).toBeInTheDocument();
  });

  it('renders the page data-slot', () => {
    mockUseRoles.mockReturnValue({ data: mockRoles, isLoading: false, error: null });
    renderWithProviders(<RoleListPage />);
    expect(document.querySelector('[data-slot="role-list-page"]')).toBeInTheDocument();
  });

  it('renders column headers', () => {
    mockUseRoles.mockReturnValue({ data: mockRoles, isLoading: false, error: null });
    renderWithProviders(<RoleListPage />);
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Description')).toBeInTheDocument();
  });

  it('renders a row for each role', () => {
    mockUseRoles.mockReturnValue({ data: mockRoles, isLoading: false, error: null });
    renderWithProviders(<RoleListPage />);
    expect(screen.getByText('admin')).toBeInTheDocument();
    expect(screen.getByText('Administrators')).toBeInTheDocument();
    expect(screen.getByText('support')).toBeInTheDocument();
    // A null description renders an em-dash placeholder.
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('renders skeletons while loading', () => {
    mockUseRoles.mockReturnValue({ data: undefined, isLoading: true, error: null });
    const { container } = renderWithProviders(<RoleListPage />);
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
    expect(screen.queryByText('admin')).not.toBeInTheDocument();
  });

  it('renders an error message on failure', () => {
    mockUseRoles.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('boom'),
    });
    renderWithProviders(<RoleListPage />);
    expect(screen.getByText('An error occurred')).toBeInTheDocument();
  });

  it('renders an empty state when there are no roles', () => {
    mockUseRoles.mockReturnValue({ data: [], isLoading: false, error: null });
    renderWithProviders(<RoleListPage />);
    expect(screen.getByText('No results found')).toBeInTheDocument();
  });
});
