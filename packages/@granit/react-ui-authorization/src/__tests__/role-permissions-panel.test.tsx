import { screen } from '@testing-library/react';

import { RolePermissionsPanel } from '../components/role-permissions-panel';

import { renderAuthorization } from './test-utils';

import type { PermissionGroupResponse } from '@granit/authorization';

const mockUsePermissionDefinitions = vi.fn();
const mockUseRolePermissions = vi.fn();
const mockGrantMutate = vi.fn();
const mockRevokeMutate = vi.fn();
const mockUsePermissionGrant = vi.fn();

vi.mock('@granit/react-authorization', () => ({
  AuthorizationProvider: ({ children }: { children: unknown }) => <>{children}</>,
  usePermissionDefinitions: (...args: unknown[]) => mockUsePermissionDefinitions(...args),
  useRolePermissions: (...args: unknown[]) => mockUseRolePermissions(...args),
  usePermissionGrant: (...args: unknown[]) => mockUsePermissionGrant(...args),
}));

vi.mock('@granit/react-identity', () => ({
  useRoles: () => ({
    data: [
      { id: '1', name: 'admin' },
      { id: '2', name: 'user' },
    ],
    isLoading: false,
  }),
}));

const sampleGroups: PermissionGroupResponse[] = [
  {
    name: 'Showcase',
    displayName: 'Showcase',
    permissions: [
      {
        name: 'Showcase.Users.Read',
        displayName: 'View users',
        multiTenancySides: 'Tenant',
      },
      {
        name: 'Showcase.Users.Manage',
        displayName: 'Manage users',
        multiTenancySides: 'Both',
      },
    ],
  },
];

beforeEach(() => {
  mockGrantMutate.mockClear();
  mockRevokeMutate.mockClear();
  mockUsePermissionGrant.mockReturnValue({
    grant: { mutate: mockGrantMutate, isPending: false },
    revoke: { mutate: mockRevokeMutate, isPending: false },
  });
});

describe('RolePermissionsPanel', () => {
  it('should show spinner when loading definitions', () => {
    mockUsePermissionDefinitions.mockReturnValue({ isLoading: true });
    mockUseRolePermissions.mockReturnValue({ isLoading: false, data: null });
    const { container } = renderAuthorization(<RolePermissionsPanel />);
    expect(
      container.querySelector('[data-slot="spinner"]') ?? container.querySelector('.animate-spin')
    ).toBeTruthy();
  });

  it('should show spinner when loading role permissions', () => {
    mockUsePermissionDefinitions.mockReturnValue({ isLoading: false, data: sampleGroups });
    mockUseRolePermissions.mockReturnValue({ isLoading: true, data: null });
    const { container } = renderAuthorization(<RolePermissionsPanel />);
    expect(
      container.querySelector('[data-slot="spinner"]') ?? container.querySelector('.animate-spin')
    ).toBeTruthy();
  });

  it('should render role selector with default value admin', () => {
    mockUsePermissionDefinitions.mockReturnValue({ isLoading: false, data: sampleGroups });
    mockUseRolePermissions.mockReturnValue({
      isLoading: false,
      data: { roleName: 'admin', permissions: [] },
    });
    renderAuthorization(<RolePermissionsPanel />);
    const trigger = screen.getByLabelText(/role/i);
    expect(trigger).toHaveTextContent('admin');
  });

  it('should render permission display names', () => {
    mockUsePermissionDefinitions.mockReturnValue({ isLoading: false, data: sampleGroups });
    mockUseRolePermissions.mockReturnValue({
      isLoading: false,
      data: { roleName: 'admin', permissions: ['Showcase.Users.Read'] },
    });
    renderAuthorization(<RolePermissionsPanel />);
    expect(screen.getByText('View users')).toBeInTheDocument();
    expect(screen.getByText('Manage users')).toBeInTheDocument();
  });

  it('should render switches for each permission', () => {
    mockUsePermissionDefinitions.mockReturnValue({ isLoading: false, data: sampleGroups });
    mockUseRolePermissions.mockReturnValue({
      isLoading: false,
      data: { roleName: 'admin', permissions: ['Showcase.Users.Read'] },
    });
    renderAuthorization(<RolePermissionsPanel />);
    const switches = screen.getAllByRole('switch');
    expect(switches).toHaveLength(2);
  });

  it('should show granted permission as checked', () => {
    mockUsePermissionDefinitions.mockReturnValue({ isLoading: false, data: sampleGroups });
    mockUseRolePermissions.mockReturnValue({
      isLoading: false,
      data: { roleName: 'admin', permissions: ['Showcase.Users.Read'] },
    });
    renderAuthorization(<RolePermissionsPanel />);
    const switches = screen.getAllByRole('switch');
    expect(switches[0]).toHaveAttribute('data-state', 'checked');
    expect(switches[1]).toHaveAttribute('data-state', 'unchecked');
  });

  it('should call revoke when toggling off a granted permission', async () => {
    mockUsePermissionDefinitions.mockReturnValue({ isLoading: false, data: sampleGroups });
    mockUseRolePermissions.mockReturnValue({
      isLoading: false,
      data: { roleName: 'admin', permissions: ['Showcase.Users.Read'] },
    });
    const { user } = renderAuthorization(<RolePermissionsPanel />);
    const switches = screen.getAllByRole('switch');

    await user.click(switches[0]);
    expect(mockRevokeMutate).toHaveBeenCalledWith({
      roleName: 'admin',
      permissionName: 'Showcase.Users.Read',
    });
  });

  it('should call grant when toggling on a non-granted permission', async () => {
    mockUsePermissionDefinitions.mockReturnValue({ isLoading: false, data: sampleGroups });
    mockUseRolePermissions.mockReturnValue({
      isLoading: false,
      data: { roleName: 'admin', permissions: [] },
    });
    const { user } = renderAuthorization(<RolePermissionsPanel />);
    const switches = screen.getAllByRole('switch');

    await user.click(switches[0]);
    expect(mockGrantMutate).toHaveBeenCalledWith({
      roleName: 'admin',
      permissionName: 'Showcase.Users.Read',
    });
  });
});
