import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@granit/react-ui';
import { dataTableFeatures } from '@granit/react-ui-kit';
import { flexRender, useTable } from '@tanstack/react-table';

import type { AIWorkspaceResponse } from '@granit/ai';
import type { DataTableColumnDef } from '@granit/react-ui-kit';

interface WorkspaceTableProps {
  readonly data: readonly AIWorkspaceResponse[];
  readonly columns: DataTableColumnDef<AIWorkspaceResponse, unknown>[];
  readonly onRowClick?: (ws: AIWorkspaceResponse) => void;
}

export function WorkspaceTable({ data, columns, onRowClick }: WorkspaceTableProps) {
  const table = useTable({
    features: dataTableFeatures,
    data: data as AIWorkspaceResponse[],
    columns,
  });

  return (
    <div data-slot="workspace-table" className="rounded-md border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow
              key={row.id}
              className={onRowClick ? 'cursor-pointer' : ''}
              onClick={() => onRowClick?.(row.original)}
            >
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
  );
}
