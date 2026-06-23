import { usePermissions } from '@granit/react-authorization';

import type { ReactNode } from 'react';

interface PermissionGuardProps {
  readonly permission: string;
  readonly children: ReactNode;
  readonly fallback?: ReactNode;
}

/**
 * Renders children only when the current user holds `permission`.
 *
 * Returns `null` while permissions are loading (deny-by-default). Renders the
 * optional `fallback` when the permission is not granted. Reads the headless
 * `usePermissions` from `@granit/react-authorization`, so it works in any app
 * that mounts an authorization provider — no app coupling.
 */
export function PermissionGuard({ permission, children, fallback = null }: PermissionGuardProps) {
  const { hasPermission, isLoading } = usePermissions();

  if (isLoading) return null;
  if (!hasPermission(permission)) return <>{fallback}</>;

  return <>{children}</>;
}
