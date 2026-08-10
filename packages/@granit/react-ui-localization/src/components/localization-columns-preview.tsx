import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@granit/react-ui';
import { dataTableFeatures } from '@granit/react-ui-kit';
import { useTable } from '@tanstack/react-table';

import { createLocalizationColumns } from './localization-columns';

import type { LocalizationOverride } from '@granit/localization';

interface LocalizationColumnsPreviewProps {
  readonly data: LocalizationOverride[];
  readonly onEdit: (o: LocalizationOverride) => void;
  readonly onDelete: (o: LocalizationOverride) => void;
}

export function LocalizationColumnsPreview({
  data,
  onEdit,
  onDelete,
}: LocalizationColumnsPreviewProps) {
  const columns = createLocalizationColumns({
    t: ((key: string) => key.split('.').pop() ?? key) as never,
    onEdit,
    onDelete,
  });

  const table = useTable({
    features: dataTableFeatures,
    data,
    columns,
  });

  return (
    <div className="rounded-md border" data-slot="localization-columns-preview">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder ? null : (header.column.columnDef.header as string)}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {typeof cell.column.columnDef.cell === 'function'
                    ? cell.column.columnDef.cell(cell.getContext())
                    : cell.getValue()}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
