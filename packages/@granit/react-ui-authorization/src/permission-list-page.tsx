import { useTranslation } from '@granit/react-localization';

import { RolePermissionsPanel } from './components/role-permissions-panel';

export interface PermissionListPageProps {
  /** Tenant-scoped admin — hides Host-only permissions. Defaults to `false`. */
  readonly isTenant?: boolean;
}

export function PermissionListPage({ isTenant = false }: PermissionListPageProps = {}) {
  const { t } = useTranslation();

  return (
    <div data-slot="permission-list-page" className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">{t('Permissions.Title')}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t('Permissions.Subtitle')}</p>
      </div>

      <RolePermissionsPanel isTenant={isTenant} />
    </div>
  );
}
