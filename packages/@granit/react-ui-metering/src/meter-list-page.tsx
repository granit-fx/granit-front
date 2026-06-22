import { useTranslation } from '@granit/react-localization';
import { useActiveMeters, useCreateMeterDefinition } from '@granit/react-metering';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@granit/react-ui';
import { flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { Plus } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { createMeterColumns } from './components/meter-columns';
import { MeterForm } from './components/meter-form';

import type { MeterFormValues } from './components/meter-form';
import type { AggregationType, MeterDefinitionResponse } from '@granit/metering';
import type { ColumnDef } from '@tanstack/react-table';

export function MeterListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [createOpen, setCreateOpen] = useState(false);

  const { data: meters, isLoading } = useActiveMeters();
  const createMeter = useCreateMeterDefinition();

  const handleViewDetail = useCallback(
    (id: string) => {
      navigate(`/metering/${id}`);
    },
    [navigate]
  );

  const columns = useMemo(
    () => createMeterColumns({ t, onViewDetail: handleViewDetail }),
    [t, handleViewDetail]
  );

  const handleCreate = async (data: MeterFormValues) => {
    // `mutate` (not `mutateAsync`) routes failures to the global
    // MutationCache.onError toast — no local catch needed.
    createMeter.mutate(
      {
        name: data.name,
        description: data.description,
        aggregationType: data.aggregationType as AggregationType,
        unit: data.unit,
      },
      {
        onSuccess: () => {
          toast.success(t('Metering.CreateSuccess'));
          setCreateOpen(false);
        },
      }
    );
  };

  return (
    <div data-slot="meter-list-page" className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">{t('Metering.List.Title')}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t('Metering.List.Description')}</p>
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {t('Metering.Actions.Create')}
        </Button>
      </div>

      {/* Data table */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={`skeleton-${i}`} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      ) : (
        <MeterDataTable columns={columns} data={[...(meters ?? [])]} />
      )}

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('Metering.Form.CreateTitle')}</DialogTitle>
            <DialogDescription>{t('Metering.Form.CreateDescription')}</DialogDescription>
          </DialogHeader>
          <MeterForm
            mode="create"
            onSubmit={handleCreate}
            onCancel={() => setCreateOpen(false)}
            isPending={createMeter.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface MeterDataTableProps {
  columns: ColumnDef<MeterDefinitionResponse, unknown>[];
  data: MeterDefinitionResponse[];
}

function MeterDataTable({ columns, data }: Readonly<MeterDataTableProps>) {
  const { t } = useTranslation();

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="rounded-md border">
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
          {table.getRowModel().rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="py-8 text-center text-muted-foreground"
              >
                {t('Common.NoResults')}
              </TableCell>
            </TableRow>
          ) : (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
