import { usePermissionGrantMeta, usePermissionGrants } from '@granit/react-authorization';
import { useDateFormatter, useTranslation } from '@granit/react-localization';
import { Input, Spinner } from '@granit/react-ui';
import { QueryDataTable, useDebouncedValue } from '@granit/react-ui-kit';
import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';

import type { PermissionGrant } from '@granit/authorization';
import type { SortEntry } from '@granit/query-engine';
import type { DataTableColumnDef } from '@granit/react-ui-kit';

const DEFAULT_PAGE_SIZE = 20;

function GrantNameCell({ row }: { readonly row: { readonly original: PermissionGrant } }) {
  return <span className="font-medium">{row.original.name}</span>;
}

function GrantProviderCell({ row }: { readonly row: { readonly original: PermissionGrant } }) {
  return <span className="font-mono text-xs">{row.original.providerName}</span>;
}

/**
 * Admin discovery surface for the `GET /authorization/grants` query endpoint.
 *
 * Exercises `usePermissionGrants` + `usePermissionGrantMeta` from
 * `@granit/react-authorization`.
 */
export function PermissionGrantsPage() {
  const { t } = useTranslation();
  const { formatDate } = useDateFormatter();

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [sort, setSort] = useState<SortEntry[]>([{ field: 'name', direction: 'asc' }]);

  const meta = usePermissionGrantMeta();
  const { data, isLoading } = usePermissionGrants(
    {},
    { page, pageSize, sort, search: debouncedSearch || undefined }
  );

  const toggleSort = (field: string) => {
    setSort((prev) => {
      const current = prev[0];
      const direction = current?.field === field && current.direction === 'asc' ? 'desc' : 'asc';
      return [{ field, direction }];
    });
  };

  const columns = useMemo<DataTableColumnDef<PermissionGrant>[]>(
    () => [
      {
        accessorKey: 'name',
        header: t('PermissionGrants.Columns.Permission'),
        cell: GrantNameCell,
      },
      {
        accessorKey: 'providerName',
        header: t('PermissionGrants.Columns.Provider'),
        enableSorting: false,
        cell: GrantProviderCell,
      },
      {
        accessorKey: 'providerKey',
        header: t('PermissionGrants.Columns.Role'),
        enableSorting: false,
        cell: ({ row }) => row.original.providerKey,
      },
      {
        accessorKey: 'createdAt',
        header: t('PermissionGrants.Columns.Created'),
        cell: ({ row }) => formatDate(row.original.createdAt),
      },
    ],
    [t, formatDate]
  );

  if (meta.isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div data-slot="permission-grants-page" className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">{t('PermissionGrants.Title')}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t('PermissionGrants.Subtitle')}</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
        <Input
          placeholder={t('Common.SearchPlaceholder')}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="pl-8"
        />
      </div>

      <QueryDataTable
        columns={columns}
        data={data?.items ?? []}
        totalCount={data?.totalCount ?? 0}
        isLoading={isLoading}
        page={page}
        pageSize={pageSize}
        sort={sort}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1);
        }}
        onToggleSort={toggleSort}
        emptyMessage={t('PermissionGrants.Empty')}
      />
    </div>
  );
}
