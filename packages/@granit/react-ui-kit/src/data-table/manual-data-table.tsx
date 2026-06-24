import { useTranslation } from '@granit/react-localization';
import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@granit/react-ui';
import { flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';

import type { ColumnDef } from '@tanstack/react-table';

export interface ManualDataTableProps<TData> {
  readonly columns: ColumnDef<TData, unknown>[];
  readonly data: readonly TData[];
  readonly totalCount: number;
  /** Current page (1-based). */
  readonly page: number;
  readonly pageSize: number;
  readonly pageSizes: readonly number[];
  readonly onPageChange: (page: number) => void;
  readonly onPageSizeChange: (size: number) => void;
  /** Hide the pagination bar entirely when everything fits on a single page. */
  readonly hidePaginationOnSinglePage?: boolean;
  readonly 'data-slot'?: string;
}

/**
 * Server-paginated TanStack table for features that own their pagination state
 * (passing `page`/`pageSize`/`totalCount` as props) rather than driving it
 * through the query engine. The richer, filter-aware variant is
 * {@link QueryDataTable}; reach for this when a feature only needs a plain
 * server-paged list with Previous/Next controls.
 */
export function ManualDataTable<TData>({
  columns,
  data,
  totalCount,
  page,
  pageSize,
  pageSizes,
  onPageChange,
  onPageSizeChange,
  hidePaginationOnSinglePage = false,
  'data-slot': dataSlot = 'manual-data-table',
}: ManualDataTableProps<TData>) {
  const { t } = useTranslation();
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const table = useReactTable({
    data: data as TData[],
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: totalPages,
  });

  const showPagination = !hidePaginationOnSinglePage || totalPages > 1;

  return (
    <div data-slot={dataSlot} className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  {t('Common.NoResults')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {showPagination && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{t('Common.RowsPerPage')}</span>
            <Select value={String(pageSize)} onValueChange={(v) => onPageSizeChange(Number(v))}>
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizes.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span>
              {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, totalCount)} / {totalCount}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
            >
              {t('Common.Previous')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
            >
              {t('Common.Next')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
