import {
  columnVisibilityFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  tableFeatures,
} from '@tanstack/react-table';

import type { Cell, CellContext, ColumnDef, Row, RowData, Table } from '@tanstack/react-table';

/**
 * The one TanStack Table v9 feature set every Granit data table is built on.
 *
 * v9 makes features opt-in and threads the resulting feature map through every
 * core type as a leading `TFeatures` generic. That turns the feature set into
 * part of the type contract: a `ColumnDef` built against a different feature
 * map is not assignable, and 28 other `@granit/react-ui-*` packages hand their
 * column definitions to the tables in this package. Pinning one set here is
 * what keeps those columns interchangeable.
 *
 * Each entry is present because a component actually calls into it — dropping
 * one removes the method, it does not merely shrink the bundle:
 *
 * - `columnVisibilityFeature` — `row.getVisibleCells()`
 * - `rowPaginationFeature` — `manualPagination`, `rowCount`, `pageCount`
 * - `rowSelectionFeature` — `row.getIsSelected()`
 * - `rowSortingFeature` — `column.getCanSort()`, `manualSorting`
 *
 * No row model factories are registered. Granit tables page, sort and filter
 * server-side through `@granit/query-engine`, so the client only ever renders
 * the core row model — which v9 always creates automatically. Adding a
 * `sortedRowModel`/`paginatedRowModel` here would silently re-sort and re-slice
 * server-resolved pages on the client.
 */
export const dataTableFeatures = tableFeatures({
  columnVisibilityFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
});

/** Feature map backing every Granit data table, as a type. */
export type DataTableFeatures = typeof dataTableFeatures;

/**
 * Column definition for a Granit data table.
 *
 * Replaces v8's `ColumnDef<TData, TValue>`: v9 requires the feature map as the
 * first generic, and this alias supplies {@link DataTableFeatures} so feature
 * packages keep a two-parameter signature.
 */
export type DataTableColumnDef<TData extends RowData, TValue = unknown> = ColumnDef<
  DataTableFeatures,
  TData,
  TValue
>;

/**
 * Cell render context handed to a column's `cell` renderer.
 *
 * Replaces v8's `CellContext<TData, TValue>`, which feature packages take as
 * the parameter type of their cell-rendering helpers.
 */
export type DataTableCellContext<TData extends RowData, TValue = unknown> = CellContext<
  DataTableFeatures,
  TData,
  TValue
>;

/** Row of a Granit data table. Replaces v8's `Row<TData>`. */
export type DataTableRow<TData extends RowData> = Row<DataTableFeatures, TData>;

/**
 * Cell of a Granit data table. Replaces v8's `Cell<TData, TValue>`.
 *
 * Unused inside the framework — exported, like {@link DataTableInstance}, so a
 * consuming app writing a custom cell renderer does not have to spell out
 * `Cell<DataTableFeatures, T>` by hand.
 */
export type DataTableCell<TData extends RowData, TValue = unknown> = Cell<
  DataTableFeatures,
  TData,
  TValue
>;

/**
 * Table instance of a Granit data table. Replaces v8's `Table<TData>`.
 *
 * Named `DataTableInstance` rather than `DataTable` because `@granit/react-ui`
 * already exports a `Table` component, and this package's barrel re-exports
 * with `export *`.
 */
export type DataTableInstance<TData extends RowData> = Table<DataTableFeatures, TData>;
