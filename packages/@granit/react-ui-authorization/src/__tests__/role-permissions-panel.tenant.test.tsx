import { mockPermissionGroups } from '@granit/react-authorization/testing';
import { screen } from '@testing-library/react';

import { RolePermissionsPanel } from '../components/role-permissions-panel';

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
  useRoles: () => ({ data: [{ id: '1', name: 'admin' }], isLoading: false }),
}));

beforeEach(() => {
  mockUsePermissionDefinitions.mockReturnValue({ isLoading: false, data: mockPermissionGroups });
  mockUseRolePermissions.mockReturnValue({
    isLoading: false,
    data: { roleName: 'admin', permissions: [] },
  });
  mockUsePermissionGrant.mockReturnValue({
    grant: { mutate: vi.fn(), isPending: false },
    revoke: { mutate: vi.fn(), isPending: false },
  });
});

describe('RolePermissionsPanel tenant scoping', () => {
  it('should hide Host-only permissions when isTenant is true', () => {
    renderAuthorization(<RolePermissionsPanel isTenant />);
    // Settings group has two Host-only perms — hidden — and two Tenant perms — kept.
    expect(screen.queryByText('View global settings')).not.toBeInTheDocument();
    expect(screen.queryByText('Modify global settings')).not.toBeInTheDocument();
    expect(screen.getByText('View tenant settings')).toBeInTheDocument();
    expect(screen.getByText('Modify tenant settings')).toBeInTheDocument();
  });

  it('should show Host-only permissions when isTenant is false (default)', () => {
    renderAuthorization(<RolePermissionsPanel />);
    expect(screen.getByText('View global settings')).toBeInTheDocument();
    expect(screen.getByText('View tenant settings')).toBeInTheDocument();
  });

  it('should disable switches while a mutation is pending', () => {
    mockUsePermissionGrant.mockReturnValue({
      grant: { mutate: vi.fn(), isPending: true },
      revoke: { mutate: vi.fn(), isPending: false },
    });
    renderAuthorization(<RolePermissionsPanel />);
    const switches = screen.getAllByRole('switch');
    expect(switches[0]).toBeDisabled();
  });
});
