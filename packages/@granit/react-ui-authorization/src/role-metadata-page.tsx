import { useGranitClient } from '@granit/react-api-client';
import { useRoleMetadata, useRoleMetadataMeta } from '@granit/react-authorization';
import { useDateFormatter, useTranslation } from '@granit/react-localization';
import { Badge, Input, Spinner } from '@granit/react-ui';
import { QueryDataTable } from '@granit/react-ui-kit';
import { useDebouncedValue } from '@granit/react-ui-kit';
import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';

import { PermissionSideBadge } from './components/permission-side-badge';

import type { RoleMetadata } from '@granit/authorization';
import type { SortEntry } from '@granit/query-engine';
import type { ColumnDef } from '@tanstack/react-table';

const DEFAULT_PAGE_SIZE = 20;

function RoleNameCell({ row }: { readonly row: { readonly original: RoleMetadata } }) {
  return <span className="font-medium">{row.original.name}</span>;
}

function RoleScopeCell({ row }: { readonly row: { readonly original: RoleMetadata } }) {
  return <PermissionSideBadge side={row.original.multiTenancySides} />;
}

function RoleIsSystemBadgeCell({ row }: { readonly row: { readonly original: RoleMetadata } }) {
  const { t } = useTranslation();
  return (
    <Badge variant={row.original.isSystem ? 'secondary' : 'outline'} className="text-[10px]">
      {row.original.isSystem ? t('Common.Yes') : t('Common.No')}
    </Badge>
  );
}

/**
 * Admin discovery surface for the `GET /authorization/role-metadata` query endpoint.
 *
 * Exercises `useRoleMetadata` + `useRoleMetadataMeta` from
 * `@granit/react-authorization`. The Axios client is resolved from a
 * `GranitClientProvider` in the host tree.
 */
export function RoleMetadataPage() {
  const { t } = useTranslation();
  const { formatDate } = useDateFormatter();
  const client = useGranitClient();

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [sort, setSort] = useState<SortEntry[]>([{ field: 'name', direction: 'asc' }]);

  const meta = useRoleMetadataMeta({ client });
  const { data, isLoading } = useRoleMetadata(
    { client },
    { page, pageSize, sort, search: debouncedSearch || undefined }
  );

  const toggleSort = (field: string) => {
    setSort((prev) => {
      const current = prev[0];
      const direction = current?.field === field && current.direction === 'asc' ? 'desc' : 'asc';
      return [{ field, direction }];
    });
  };

  const columns = useMemo<ColumnDef<RoleMetadata>[]>(
    () => [
      {
        accessorKey: 'name',
        header: t('RoleMetadata.Columns.Role'),
        cell: RoleNameCell,
      },
      {
        accessorKey: 'multiTenancySides',
        header: t('RoleMetadata.Columns.Scope'),
        enableSorting: false,
        cell: RoleScopeCell,
      },
      {
        accessorKey: 'description',
        header: t('RoleMetadata.Columns.Description'),
        enableSorting: false,
        cell: ({ row }) => row.original.description ?? '—',
      },
      {
        accessorKey: 'isSystem',
        header: t('RoleMetadata.Columns.System'),
        enableSorting: false,
        cell: RoleIsSystemBadgeCell,
      },
      {
        accessorKey: 'createdAt',
        header: t('RoleMetadata.Columns.Created'),
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
    <div data-slot="role-metadata-page" className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">{t('RoleMetadata.Title')}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t('RoleMetadata.Subtitle')}</p>
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
        emptyMessage={t('RoleMetadata.Empty')}
      />
    </div>
  );
}
