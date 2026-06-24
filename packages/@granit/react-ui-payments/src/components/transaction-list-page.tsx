import { useTranslation } from '@granit/react-localization';
import { usePaymentTransactions } from '@granit/react-payments';
import {
  Button,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@granit/react-ui';
import { getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { Plus } from 'lucide-react';
import { useMemo, useState } from 'react';

import { ChargeDialog } from './charge-dialog';
import { createTransactionColumns } from './transaction-columns';

export function TransactionListPage() {
  const { t } = useTranslation();
  const [chargeOpen, setChargeOpen] = useState(false);

  const transactionsQuery = usePaymentTransactions();

  const columns = useMemo(() => createTransactionColumns({ t }), [t]);

  const transactions = [...(transactionsQuery.data?.items ?? [])];

  const table = useReactTable({
    data: transactions,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (transactionsQuery.isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div data-slot="transaction-list-page" className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">
            {t('Payments.Transactions.Title')}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('Payments.Transactions.Subtitle')}
          </p>
        </div>
        <Button size="sm" onClick={() => setChargeOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {t('Payments.Charge.Title')}
        </Button>
      </div>

      <div className="rounded-md border">
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
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {typeof cell.column.columnDef.cell === 'function'
                        ? cell.column.columnDef.cell(cell.getContext())
                        : cell.getValue()}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="py-8 text-center text-muted-foreground"
                >
                  {t('Common.NoResults')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <ChargeDialog open={chargeOpen} onOpenChange={setChargeOpen} />
    </div>
  );
}
