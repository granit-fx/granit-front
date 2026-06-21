import {
  usePermissionDefinitions,
  usePermissionGrant,
  useRolePermissions,
} from '@granit/react-authorization';
import { useRoles } from '@granit/react-identity';
import { useTranslation } from '@granit/react-localization';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Spinner,
  Switch,
} from '@granit/react-ui';
import * as React from 'react';

import { PermissionSideBadge } from './permission-side-badge';

import type { PermissionGroupResponse } from '@granit/authorization';

const DEFAULT_ROLE = 'admin';

export interface RolePermissionsPanelProps {
  /**
   * Tenant-scoped admin: Host-only permissions cannot be granted at the tenant
   * level (the backend rejects them), so they are hidden. Host apps pass `false`
   * (default), tenant apps pass `true`.
   */
  readonly isTenant?: boolean;
}

export function RolePermissionsPanel({ isTenant = false }: RolePermissionsPanelProps = {}) {
  const { t } = useTranslation();
  const [roleName, setRoleName] = React.useState(DEFAULT_ROLE);

  const { data: availableRoles, isLoading: isLoadingRoles } = useRoles();
  const { data: groups, isLoading: isLoadingDefinitions } = usePermissionDefinitions();
  const { data: roleGrants, isLoading: isLoadingGrants } = useRolePermissions({
    roleName,
    enabled: !!roleName,
  });
  const { grant, revoke } = usePermissionGrant();

  const grantedSet = React.useMemo(
    () => new Set(roleGrants?.permissions ?? []),
    [roleGrants?.permissions]
  );

  // In a tenant-scoped admin, Host-only permissions cannot be granted at the
  // tenant level — the backend rejects them. Hide them to avoid confusion.
  const visibleGroups = React.useMemo<PermissionGroupResponse[]>(() => {
    if (!groups || !isTenant) return groups ?? [];
    return groups
      .map((group) => ({
        ...group,
        permissions: group.permissions.filter((p) => p.multiTenancySides !== 'Host'),
      }))
      .filter((group) => group.permissions.length > 0);
  }, [groups, isTenant]);

  const isLoading = isLoadingDefinitions || isLoadingGrants;
  const isMutating = grant.isPending || revoke.isPending;

  const roleOptions = React.useMemo(() => {
    const names = new Set<string>(availableRoles?.map((r) => r.name) ?? []);
    if (roleName) names.add(roleName);
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [availableRoles, roleName]);

  const handleToggle = (permissionName: string, currentlyGranted: boolean) => {
    const mutation = currentlyGranted ? revoke : grant;
    mutation.mutate({ roleName, permissionName });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Role selector */}
      <div className="flex items-center gap-3">
        <label htmlFor="role-select" className="text-sm font-medium text-muted-foreground">
          {t('Permissions.Roles.SelectRole')}
        </label>
        <Select value={roleName} onValueChange={setRoleName} disabled={isLoadingRoles}>
          <SelectTrigger id="role-select" className="w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {roleOptions.map((name) => (
              <SelectItem key={name} value={name}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Permission groups */}
      {visibleGroups.map((group) => (
        <Card key={group.name}>
          <CardHeader>
            <CardTitle className="text-base">{group.displayName ?? group.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {group.permissions.map((perm) => {
                const isGranted = grantedSet.has(perm.name);
                return (
                  <div key={perm.name} className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground">
                          {perm.displayName ?? perm.name}
                        </p>
                        <PermissionSideBadge side={perm.multiTenancySides} />
                      </div>
                      <p className="text-xs font-mono text-muted-foreground">{perm.name}</p>
                    </div>
                    <Switch
                      checked={isGranted}
                      onCheckedChange={() => handleToggle(perm.name, isGranted)}
                      disabled={isMutating}
                    />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
