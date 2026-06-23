import { screen } from '@testing-library/react';

import { renderWithProviders } from '../__tests__/test-utils';

import { GroupListPage } from './group-list-page';

import type { IdentityGroup } from '@granit/identity';

const { mockUseGroups, mockNavigate } = vi.hoisted(() => ({
  mockUseGroups: vi.fn(),
  mockNavigate: vi.fn(),
}));

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('@granit/react-identity', () => ({
  useGroups: mockUseGroups,
  useIdentityCapabilities: () => ({ data: undefined }),
}));

const nestedGroups: IdentityGroup[] = [
  {
    id: 'grp-1',
    name: 'Administrators',
    path: '/administrators',
    subGroups: [
      { id: 'grp-1a', name: 'Super Admins', path: '/administrators/super', subGroups: [] },
    ],
  },
];

describe('GroupListPage tree', () => {
  afterEach(() => vi.clearAllMocks());

  it('renders a root node expanded by default, showing its children', () => {
    mockUseGroups.mockReturnValue({ data: nestedGroups, isLoading: false, error: null });
    renderWithProviders(<GroupListPage />);
    expect(screen.getByText('Administrators')).toBeInTheDocument();
    // depth 0 starts expanded → the child is visible.
    expect(screen.getByText('Super Admins')).toBeInTheDocument();
  });

  it('collapses and re-expands a node with children', async () => {
    mockUseGroups.mockReturnValue({ data: nestedGroups, isLoading: false, error: null });
    const { user } = renderWithProviders(<GroupListPage />);

    await user.click(screen.getByRole('button', { name: 'Collapse' }));
    expect(screen.queryByText('Super Admins')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Expand' }));
    expect(screen.getByText('Super Admins')).toBeInTheDocument();
  });

  it('navigates to the group detail when the node name is clicked', async () => {
    mockUseGroups.mockReturnValue({ data: nestedGroups, isLoading: false, error: null });
    const { user } = renderWithProviders(<GroupListPage />);
    await user.click(screen.getByRole('button', { name: 'Administrators' }));
    expect(mockNavigate).toHaveBeenCalledWith('/identity/groups/grp-1');
  });

  it('renders skeletons while groups are loading', () => {
    mockUseGroups.mockReturnValue({ data: undefined, isLoading: true, error: null });
    const { container } = renderWithProviders(<GroupListPage />);
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
  });

  it('renders an error message on fetch failure', () => {
    mockUseGroups.mockReturnValue({ data: undefined, isLoading: false, error: new Error('boom') });
    renderWithProviders(<GroupListPage />);
    expect(screen.getByText('An error occurred')).toBeInTheDocument();
  });

  it('renders the empty state when no groups exist', () => {
    mockUseGroups.mockReturnValue({ data: [], isLoading: false, error: null });
    renderWithProviders(<GroupListPage />);
    expect(screen.getByText('No results found')).toBeInTheDocument();
  });
});
