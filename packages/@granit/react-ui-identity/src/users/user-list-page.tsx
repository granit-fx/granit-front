import { usePermissions } from '@granit/react-authorization';
import { DataExchangeProvider } from '@granit/react-data-exchange';
import { useProviderUsers } from '@granit/react-identity';
import { useTranslation } from '@granit/react-localization';
import { Button, Input } from '@granit/react-ui';
import {
  ExportButton,
  ExportDialog,
  ImportButton,
  ImportDialog,
} from '@granit/react-ui-data-exchange';
import { Plus, Search } from 'lucide-react';
import * as React from 'react';
import { useNavigate } from 'react-router';

import { UserCreateDialog } from './components/user-create-dialog';
import { UserTable } from './components/user-table';

const PAGE_SIZE = 20;

function computeTotalPages(rowCount: number | undefined): number {
  if (rowCount === undefined) return 1;
  const base = Math.ceil(rowCount / PAGE_SIZE);
  // Keycloak's list endpoint returns `max` rows when more pages remain —
  // bump the count so the pager exposes a "next" link in that case.
  return rowCount === PAGE_SIZE ? base + 1 : base;
}

export function UserListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [search, setSearch] = React.useState('');
  const [debouncedSearch, setDebouncedSearch] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [exportOpen, setExportOpen] = React.useState(false);
  const [importOpen, setImportOpen] = React.useState(false);
  const [createOpen, setCreateOpen] = React.useState(false);
  const { hasPermission } = usePermissions();
  const canManageUsers = hasPermission('Identity.Users.Manage');

  // Debounce search input
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading, error } = useProviderUsers({
    search: debouncedSearch || undefined,
    first: (page - 1) * PAGE_SIZE,
    max: PAGE_SIZE,
  });

  const totalPages = computeTotalPages(data?.length);

  const handleViewDetails = React.useCallback(
    (userId: string) => {
      navigate(`/identity/users/${userId}`);
    },
    [navigate]
  );

  return (
    <DataExchangeProvider>
      <div data-slot="user-list-page" className="space-y-6">
        {/* Page header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">{t('Users.Title')}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t('Users.Subtitle')}</p>
          </div>
          <div className="flex items-center gap-2">
            {canManageUsers && (
              <Button size="sm" onClick={() => setCreateOpen(true)}>
                <Plus className="mr-1 h-4 w-4" />
                {t('Users.CreateButton', 'Create')}
              </Button>
            )}
            <ExportButton
              onExport={() => setExportOpen(true)}
              label={t('DataExchange.Export.Label')}
            />
            <ImportButton
              onImport={() => setImportOpen(true)}
              label={t('DataExchange.Import.Label')}
            />
          </div>
        </div>

        {/* Search and actions */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/70"
              aria-hidden="true"
            />
            <Input
              type="search"
              placeholder={t('Common.SearchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              aria-label={t('Common.SearchPlaceholder')}
            />
          </div>
          {data && (
            <p className="text-sm text-muted-foreground">
              {t('Pagination.Showing', {
                from: 1,
                to: data.length,
                total: data.length,
              })}
            </p>
          )}
        </div>

        {/* Error state */}
        {error && (
          <div className="rounded-lg border border-destructive/50 p-8 text-center text-destructive">
            {t('Common.Error', 'An error occurred while loading data.')}
          </div>
        )}

        {/* User table */}
        <UserTable users={data ?? []} loading={isLoading} onViewDetails={handleViewDetails} />

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              {t('Pagination.Previous')}
            </Button>
            <span className="text-sm text-muted-foreground">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              {t('Pagination.Next')}
            </Button>
          </div>
        )}

        {/* Create user dialog */}
        <UserCreateDialog open={createOpen} onOpenChange={setCreateOpen} />

        {/* Export / Import dialogs */}
        <ExportDialog
          definitionName="Showcase.UserExport"
          open={exportOpen}
          onOpenChange={setExportOpen}
          search={debouncedSearch || undefined}
        />
        <ImportDialog
          definitionName="Showcase.UserImport"
          open={importOpen}
          onOpenChange={setImportOpen}
        />
      </div>
    </DataExchangeProvider>
  );
}
