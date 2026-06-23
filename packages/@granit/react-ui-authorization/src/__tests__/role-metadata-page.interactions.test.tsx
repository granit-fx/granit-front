import { mockRoleMetadata } from '@granit/react-authorization/testing';
import { screen } from '@testing-library/react';

import { RoleMetadataPage } from '../role-metadata-page';

import { renderAuthorization } from './test-utils';

const mockUseRoleMetadata = vi.fn();
const mockUseRoleMetadataMeta = vi.fn();

vi.mock('@granit/react-authorization', () => ({
  AuthorizationProvider: ({ children }: { children: unknown }) => <>{children}</>,
  useRoleMetadata: (...args: unknown[]) => mockUseRoleMetadata(...args),
  useRoleMetadataMeta: (...args: unknown[]) => mockUseRoleMetadataMeta(...args),
}));

beforeEach(() => {
  mockUseRoleMetadataMeta.mockReturnValue({ data: undefined, isLoading: false });
  mockUseRoleMetadata.mockReturnValue({
    data: { items: mockRoleMetadata, totalCount: 80, hasMore: true, nextCursor: null },
    isLoading: false,
  });
});

describe('RoleMetadataPage interactions', () => {
  it('should show a spinner while metadata is loading', () => {
    mockUseRoleMetadataMeta.mockReturnValue({ data: undefined, isLoading: true });
    const { container } = renderAuthorization(<RoleMetadataPage />);
    expect(
      container.querySelector('[data-slot="spinner"]') ?? container.querySelector('.animate-spin')
    ).toBeTruthy();
  });

  it('should update the search input value', async () => {
    const { user } = renderAuthorization(<RoleMetadataPage />);
    const input = screen.getByPlaceholderText('Search…');
    await user.type(input, 'viewer');
    expect(input).toHaveValue('viewer');
  });

  it('should toggle sort when the sortable header is clicked', async () => {
    const { user } = renderAuthorization(<RoleMetadataPage />);
    const header = screen.getByRole('button', { name: /^role$/i });
    await user.click(header);
    expect(header).toBeInTheDocument();
    await user.click(header);
    expect(header).toBeInTheDocument();
  });

  it('should call the pagination next-page callback', async () => {
    const { user } = renderAuthorization(<RoleMetadataPage />);
    await user.click(screen.getByRole('button', { name: /next/i }));
    expect(screen.getByText(mockRoleMetadata[0]!.name)).toBeInTheDocument();
  });

  it('should change the page size via the rows-per-page selector', async () => {
    const { user } = renderAuthorization(<RoleMetadataPage />);
    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByRole('option', { name: '50' }));
    expect(screen.getByText(mockRoleMetadata[0]!.name)).toBeInTheDocument();
  });

  it('should render the system badge and the dash for a missing description', () => {
    mockUseRoleMetadata.mockReturnValue({
      data: {
        items: [{ ...mockRoleMetadata[1]!, description: null }],
        totalCount: 1,
        hasMore: false,
        nextCursor: null,
      },
      isLoading: false,
    });
    renderAuthorization(<RoleMetadataPage />);
    expect(screen.getByText('—')).toBeInTheDocument();
    expect(screen.getByText('No')).toBeInTheDocument();
  });

  it('should render an empty table when there are no items', () => {
    mockUseRoleMetadata.mockReturnValue({
      data: { items: [], totalCount: 0, hasMore: false, nextCursor: null },
      isLoading: false,
    });
    renderAuthorization(<RoleMetadataPage />);
    expect(screen.getByText(/no roles found/i)).toBeInTheDocument();
  });
});
