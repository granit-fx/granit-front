import { screen } from '@testing-library/react';

import { PermissionListPage } from '../permission-list-page';

import { renderAuthorization } from './test-utils';

const mockUsePermissionDefinitions = vi.fn();
const mockUseRolePermissions = vi.fn();
const mockUsePermissionGrant = vi.fn();

vi.mock('@granit/react-authorization', () => ({
  AuthorizationProvider: ({ children }: { children: unknown }) => <>{children}</>,
  usePermissionDefinitions: (...args: unknown[]) => mockUsePermissionDefinitions(...args),
  useRolePermissions: (...args: unknown[]) => mockUseRolePermissions(...args),
  usePermissionGrant: (...args: unknown[]) => mockUsePermissionGrant(...args),
}));

vi.mock('@granit/react-identity', () => ({
  useRoles: () => ({ data: [], isLoading: false }),
}));

beforeEach(() => {
  mockUsePermissionDefinitions.mockReturnValue({ data: [], isLoading: false });
  mockUseRolePermissions.mockReturnValue({
    data: { roleName: 'admin', permissions: [] },
    isLoading: false,
  });
  mockUsePermissionGrant.mockReturnValue({
    grant: { mutate: vi.fn(), isPending: false },
    revoke: { mutate: vi.fn(), isPending: false },
  });
});

describe('PermissionListPage', () => {
  it('should render page title', () => {
    renderAuthorization(<PermissionListPage />);
    expect(screen.getByText('Permissions')).toBeInTheDocument();
  });

  it('should render subtitle', () => {
    renderAuthorization(<PermissionListPage />);
    expect(screen.getByText(/permission definitions and role assignments/i)).toBeInTheDocument();
  });
});
