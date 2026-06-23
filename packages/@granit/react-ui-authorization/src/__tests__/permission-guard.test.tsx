import { render, screen } from '@testing-library/react';

import { PermissionGuard } from '../components/permission-guard';

let perms = { hasPermission: (_p: string) => true, isLoading: false };
vi.mock('@granit/react-authorization', () => ({
  usePermissions: () => perms,
}));

describe('PermissionGuard', () => {
  it('renders children when the permission is granted', () => {
    perms = { hasPermission: () => true, isLoading: false };
    render(
      <PermissionGuard permission="X.Read">
        <div>secret</div>
      </PermissionGuard>
    );
    expect(screen.getByText('secret')).toBeInTheDocument();
  });

  it('renders the fallback when denied', () => {
    perms = { hasPermission: () => false, isLoading: false };
    render(
      <PermissionGuard permission="X.Read" fallback={<div>denied</div>}>
        <div>secret</div>
      </PermissionGuard>
    );
    expect(screen.getByText('denied')).toBeInTheDocument();
    expect(screen.queryByText('secret')).not.toBeInTheDocument();
  });

  it('renders nothing while loading (deny-by-default)', () => {
    perms = { hasPermission: () => true, isLoading: true };
    const { container } = render(
      <PermissionGuard permission="X.Read">
        <div>secret</div>
      </PermissionGuard>
    );
    expect(container).toBeEmptyDOMElement();
  });
});
