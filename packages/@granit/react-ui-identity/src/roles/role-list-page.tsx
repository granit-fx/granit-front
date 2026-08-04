import { useRoles } from '@granit/react-identity';
import { useTranslation } from '@granit/react-localization';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@granit/react-ui';
import { useNavigate } from 'react-router';

const SKELETON_ROW_KEYS = ['s0', 's1', 's2', 's3'] as const;

export function RoleListPage() {
  const { t } = useTranslation();
  const { data: roles, isLoading, error } = useRoles();
  const navigate = useNavigate();

  return (
    <div data-slot="role-list-page" className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">
          {t('Identity.Roles.Title', 'Roles')}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t('Identity.Roles.Description', 'Manage identity provider roles')}
        </p>
      </div>

      {isLoading && (
        <div className="space-y-2">
          {SKELETON_ROW_KEYS.map((key) => (
            <div key={key} className="h-12 animate-pulse rounded-md bg-muted" />
          ))}
        </div>
      )}

      {!isLoading && error && (
        <div className="rounded-lg border border-destructive/50 p-8 text-center text-destructive">
          {t('Common.Error', 'An error occurred while loading data.')}
        </div>
      )}

      {!isLoading && !error && roles && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('Identity.Roles.Columns.Name', 'Name')}</TableHead>
              <TableHead>{t('Identity.Roles.Columns.Description', 'Description')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {roles.map((role) => (
              <TableRow
                key={role.id}
                className="cursor-pointer"
                onClick={() => navigate(`/identity/roles/${role.name}`)}
              >
                <TableCell className="font-mono font-medium">{role.name}</TableCell>
                <TableCell>{role.description ?? '—'}</TableCell>
              </TableRow>
            ))}
            {roles.length === 0 && (
              <TableRow>
                <TableCell colSpan={2} className="text-center text-muted-foreground">
                  {t('Common.NoResults', 'No results found')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
