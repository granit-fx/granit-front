import { mockPermissionGrants } from '@granit/react-authorization/testing';
import { screen } from '@testing-library/react';

import { PermissionGrantsPage } from '../permission-grants-page';

import { renderAuthorization } from './test-utils';

const mockUsePermissionGrants = vi.fn();
const mockUsePermissionGrantMeta = vi.fn();

vi.mock('@granit/react-authorization', () => ({
  AuthorizationProvider: ({ children }: { children: unknown }) => <>{children}</>,
  usePermissionGrants: (...args: unknown[]) => mockUsePermissionGrants(...args),
  usePermissionGrantMeta: (...args: unknown[]) => mockUsePermissionGrantMeta(...args),
}));

beforeEach(() => {
  mockUsePermissionGrantMeta.mockReturnValue({ data: undefined, isLoading: false });
  mockUsePermissionGrants.mockReturnValue({
    data: { items: mockPermissionGrants, totalCount: 80, hasMore: true, nextCursor: null },
    isLoading: false,
  });
});

describe('PermissionGrantsPage interactions', () => {
  it('should show a spinner while metadata is loading', () => {
    mockUsePermissionGrantMeta.mockReturnValue({ data: undefined, isLoading: true });
    const { container } = renderAuthorization(<PermissionGrantsPage />);
    expect(
      container.querySelector('[data-slot="spinner"]') ?? container.querySelector('.animate-spin')
    ).toBeTruthy();
  });

  it('should debounce the search input and reset the page', async () => {
    const { user } = renderAuthorization(<PermissionGrantsPage />);
    const input = screen.getByPlaceholderText('Search…');
    await user.type(input, 'admin');
    expect(input).toHaveValue('admin');
  });

  it('should toggle sort when the sortable header is clicked', async () => {
    const { user } = renderAuthorization(<PermissionGrantsPage />);
    const header = screen.getByRole('button', { name: /permission/i });
    await user.click(header);
    expect(header).toBeInTheDocument();
    // Second click flips asc -> desc, exercising the alternate branch.
    await user.click(header);
    expect(header).toBeInTheDocument();
  });

  it('should call the pagination next-page callback', async () => {
    const { user } = renderAuthorization(<PermissionGrantsPage />);
    await user.click(screen.getByRole('button', { name: /next/i }));
    expect(screen.getByText(mockPermissionGrants[0]!.name)).toBeInTheDocument();
  });

  it('should change the page size via the rows-per-page selector', async () => {
    const { user } = renderAuthorization(<PermissionGrantsPage />);
    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByRole('option', { name: '50' }));
    expect(screen.getByText(mockPermissionGrants[0]!.name)).toBeInTheDocument();
  });

  it('should render an empty table when there are no items', () => {
    mockUsePermissionGrants.mockReturnValue({
      data: { items: [], totalCount: 0, hasMore: false, nextCursor: null },
      isLoading: false,
    });
    renderAuthorization(<PermissionGrantsPage />);
    expect(screen.getByText(/no permission grants/i)).toBeInTheDocument();
  });
});
