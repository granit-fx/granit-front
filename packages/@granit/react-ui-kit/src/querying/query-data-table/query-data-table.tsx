// ---------------------------------------------------------------------------
// QueryDataTable — TanStack Table + @granit/ui Table (Story #55)
// ---------------------------------------------------------------------------

import {
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@granit/react-ui';
import { cn } from '@granit/utils';
import { flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { ChevronDownIcon, ChevronRightIcon } from 'lucide-react';
import { useState } from 'react';

import { EmptyState } from './empty-state.js';
import { SortableHeader } from './sortable-header.js';
import { TablePagination } from './table-pagination.js';

import type { GroupEntry, SortEntry } from '@granit/query-engine';
import type { ColumnDef, Row } from '@tanstack/react-table';

export interface QueryDataTableProps<T> {
  /** TanStack Table column definitions. */
  readonly columns: readonly ColumnDef<T, unknown>[];
  /** Data items. */
  readonly data: readonly T[];
  /** Total count for pagination. */
  readonly totalCount: number;
  /** Whether data is loading. */
  readonly isLoading?: boolean;
  /** Current page (1-based). */
  readonly page?: number;
  /** Items per page. */
  readonly pageSize?: number;
  /** Current sort entries. */
  readonly sort?: readonly SortEntry[];
  /** Callback when page changes. */
  readonly onPageChange?: (page: number) => void;
  /** Callback when page size changes. */
  readonly onPageSizeChange?: (pageSize: number) => void;
  /** Callback when sort toggles. */
  readonly onToggleSort?: (field: string) => void;
  /** Grouped data (when groupBy is active). Overrides `data` when provided. */
  readonly groups?: readonly GroupEntry<T>[];
  /** Empty state message. */
  readonly emptyMessage?: string;
  /** Number of skeleton rows shown during loading. */
  readonly skeletonRows?: number;
  /** CSS class. */
  readonly className?: string;
}

/**
 * Data table powered by TanStack Table v8 and @granit/ui Table components.
 *
 * Integrates with useQueryEndpoint dispatchers for pagination and sorting.
 *
 * @example
 * ```tsx
 * const { query, params, setPage, setPageSize, toggleSort } = useQueryEndpoint<Patient>();
 *
 * <QueryDataTable
 *   columns={patientColumns}
 *   data={query.data?.items ?? []}
 *   totalCount={query.data?.totalCount ?? 0}
 *   isLoading={query.isLoading}
 *   page={params.page}
 *   pageSize={params.pageSize}
 *   sort={params.sort}
 *   onPageChange={setPage}
 *   onPageSizeChange={setPageSize}
 *   onToggleSort={toggleSort}
 * />
 * ```
 */
export function QueryDataTable<T>({
  columns,
  data,
  totalCount,
  isLoading = false,
  page = 1,
  pageSize = 20,
  sort,
  onPageChange,
  onPageSizeChange,
  onToggleSort,
  groups,
  emptyMessage,
  skeletonRows = 5,
  className,
}: Readonly<QueryDataTableProps<T>>) {
  // When grouped, flatten all group items for the table model
  const flatData = groups ? groups.flatMap((g) => g.items ?? []) : data;

  // TanStack Table API is inherently non-memoizable.
  const table = useReactTable({
    data: flatData as T[],
    columns: columns as ColumnDef<T, unknown>[],
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    rowCount: totalCount,
  });

  // Track collapsed groups
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const toggleGroup = (key: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  // Build grouped rows: for each group, compute the row index offset
  const renderGroupedBody = () => {
    if (!groups) return null;
    const allRows = table.getRowModel().rows;
    let rowOffset = 0;

    return groups.map((group) => {
      const groupKey = String(group.value);
      const isCollapsed = collapsedGroups.has(groupKey);
      const items = group.items ?? [];
      const groupRows = allRows.slice(rowOffset, rowOffset + items.length);
      rowOffset += items.length;

      return (
        <GroupRows
          key={groupKey}
          group={group}
          rows={groupRows}
          colSpan={columns.length}
          isCollapsed={isCollapsed}
          onToggle={() => toggleGroup(groupKey)}
        />
      );
    });
  };

  const isEmpty = groups ? groups.length === 0 : table.getRowModel().rows.length === 0;

  return (
    <div data-slot="query-data-table" className={className}>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const sortEntry = sort?.find((s) => s.field === header.column.id);
                  const isSortable = header.column.getCanSort() && onToggleSort;

                  let headerContent: React.ReactNode = null;
                  if (!header.isPlaceholder) {
                    headerContent = isSortable ? (
                      <SortableHeader
                        label={
                          typeof header.column.columnDef.header === 'string'
                            ? header.column.columnDef.header
                            : header.column.id
                        }
                        direction={sortEntry?.direction}
                        onToggle={() => onToggleSort(header.column.id)}
                      />
                    ) : (
                      flexRender(header.column.columnDef.header, header.getContext())
                    );
                  }

                  return <TableHead key={header.id}>{headerContent}</TableHead>;
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: skeletonRows }).map((_, i) => (
                <TableRow key={`skeleton-${String(i)}`}>
                  {columns.map((_, j) => (
                    <TableCell key={`skeleton-cell-${String(j)}`}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            {!isLoading && isEmpty && (
              <TableRow>
                <TableCell colSpan={columns.length}>
                  <EmptyState message={emptyMessage} />
                </TableCell>
              </TableRow>
            )}
            {!isLoading && groups && renderGroupedBody()}
            {!isLoading &&
              !groups &&
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() ? 'selected' : undefined}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>

      {!isLoading && !groups && totalCount > 0 && onPageChange && onPageSizeChange && (
        <div className="mt-4">
          <TablePagination
            page={page}
            pageSize={pageSize}
            totalCount={totalCount}
            onPageChange={onPageChange}
            onPageSizeChange={onPageSizeChange}
          />
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// GroupRows — collapsible group header + data rows
// ---------------------------------------------------------------------------

interface GroupRowsProps<T> {
  readonly group: GroupEntry<T>;
  readonly rows: readonly Row<T>[];
  readonly colSpan: number;
  readonly isCollapsed: boolean;
  readonly onToggle: () => void;
}

function GroupRows<T>({
  group,
  rows,
  colSpan,
  isCollapsed,
  onToggle,
}: Readonly<GroupRowsProps<T>>) {
  const hasItems = rows.length > 0;
  const ChevronIcon = isCollapsed ? ChevronRightIcon : ChevronDownIcon;

  return (
    <>
      <TableRow
        data-slot="group-header"
        className={cn('bg-muted/50', hasItems && 'cursor-pointer hover:bg-muted')}
        onClick={hasItems ? onToggle : undefined}
      >
        <TableCell colSpan={colSpan}>
          <span className="flex items-center gap-2 font-medium">
            {hasItems && <ChevronIcon className="size-4" />}
            {group.label}
            <span className="text-xs text-muted-foreground">({group.count})</span>
          </span>
        </TableCell>
      </TableRow>
      {hasItems &&
        !isCollapsed &&
        rows.map((row) => (
          <TableRow key={row.id} data-state={row.getIsSelected() ? 'selected' : undefined}>
            {row.getVisibleCells().map((cell) => (
              <TableCell key={cell.id}>
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </TableCell>
            ))}
          </TableRow>
        ))}
    </>
  );
}
