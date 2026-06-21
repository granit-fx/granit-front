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
    data: {
      items: [
        {
          id: '1',
          name: 'Showcase.Users.Manage',
          providerName: 'R',
          providerKey: 'admin',
          tenantId: null,
          createdAt: '2026-01-01T00:00:00Z',
          createdBy: 'system',
          modifiedAt: null,
          modifiedBy: null,
        },
      ],
      totalCount: 1,
      hasMore: false,
      nextCursor: null,
    },
    isLoading: false,
  });
});

describe('PermissionGrantsPage', () => {
  it('should render the title', () => {
    renderAuthorization(<PermissionGrantsPage />);
    expect(screen.getByText('Permission grants')).toBeInTheDocument();
  });

  it('should render a grant row', () => {
    renderAuthorization(<PermissionGrantsPage />);
    expect(screen.getByText('Showcase.Users.Manage')).toBeInTheDocument();
  });
});
