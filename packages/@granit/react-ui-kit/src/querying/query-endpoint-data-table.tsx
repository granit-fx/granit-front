import { QueryDataTable } from './query-data-table/query-data-table';

import type { DataTableColumnDef } from '../data-table/table-features.js';
import type { useQueryEndpoint } from '@granit/react-query-engine';
import type { RowData } from '@tanstack/react-table';

type QueryEndpoint<T> = ReturnType<typeof useQueryEndpoint<T>>;

/**
 * Thin wrapper around `<QueryDataTable>` that unwraps the
 * `isGrouped ? grouped : paged` branching consumed by every list page.
 */
export function QueryEndpointDataTable<T extends RowData>({
  queryEndpoint,
  columns,
}: Readonly<{
  queryEndpoint: QueryEndpoint<T>;
  columns: readonly DataTableColumnDef<T>[];
}>) {
  const { isGrouped, params, query, groupedQuery, setPage, setPageSize, toggleSort } =
    queryEndpoint;
  const totalCount = isGrouped
    ? (groupedQuery.data?.totalCount ?? 0)
    : (query.data?.totalCount ?? 0);

  return (
    <QueryDataTable
      columns={columns}
      data={isGrouped ? [] : (query.data?.items ?? [])}
      groups={isGrouped ? groupedQuery.data?.groups : undefined}
      totalCount={totalCount}
      isLoading={isGrouped ? groupedQuery.isLoading : query.isLoading}
      page={params.page}
      pageSize={params.pageSize}
      sort={params.sort}
      onPageChange={setPage}
      onPageSizeChange={setPageSize}
      onToggleSort={toggleSort}
    />
  );
}
