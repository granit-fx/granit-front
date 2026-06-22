import { useDateFormatter, useTranslation } from '@granit/react-localization';
import { usePaymentTransaction } from '@granit/react-payments';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Separator,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@granit/react-ui';
import { toEntityId } from '@granit/types';
import { getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { createDisputeColumns } from './components/dispute-columns';
import { createRefundColumns } from './components/refund-columns';
import { RefundDialog } from './components/refund-dialog';
import { TransactionStatusBadge } from './components/transaction-status-badge';

import type { PaymentDisputeResponse, PaymentRefundResponse } from '@granit/payments';

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en', { style: 'currency', currency }).format(amount / 100);
}

export function TransactionDetailPage() {
  const { t } = useTranslation();
  const { formatDateTime } = useDateFormatter();
  const { id } = useParams<{ id: string }>();
  const [refundOpen, setRefundOpen] = useState(false);

  const transactionId = toEntityId<'PaymentTransaction'>(id!);
  const transactionQuery = usePaymentTransaction(transactionId);

  const refundColumns = useMemo(
    () => createRefundColumns({ t, formatDateTime }),
    [t, formatDateTime]
  );
  const disputeColumns = useMemo(
    () => createDisputeColumns({ t, formatDateTime }),
    [t, formatDateTime]
  );

  const transaction = transactionQuery.data;
  const refunds: PaymentRefundResponse[] = [...(transaction?.refunds ?? [])];
  const disputes: PaymentDisputeResponse[] = [...(transaction?.disputes ?? [])];

  const refundTable = useReactTable({
    data: refunds,
    columns: refundColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  const disputeTable = useReactTable({
    data: disputes,
    columns: disputeColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (transactionQuery.isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        {t('Payments.Transactions.NotFound')}
      </div>
    );
  }

  return (
    <div data-slot="transaction-detail-page" className="space-y-6">
      {/* Back link and actions */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/payments/transactions">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('Common.Back')}
          </Link>
        </Button>
        {transaction.status === 'Succeeded' && (
          <Button variant="outline" size="sm" onClick={() => setRefundOpen(true)}>
            <RotateCcw className="mr-2 h-4 w-4" />
            {t('Payments.Refund.Title')}
          </Button>
        )}
      </div>

      {/* Transaction info */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{t('Payments.Transactions.Detail')}</CardTitle>
            <TransactionStatusBadge status={transaction.status} />
          </div>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                {t('Payments.Transactions.Columns.Id')}
              </dt>
              <dd className="mt-1 font-mono text-sm">{transaction.id}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                {t('Payments.Transactions.Columns.Amount')}
              </dt>
              <dd className="mt-1 text-sm font-semibold">
                {formatCurrency(transaction.amount, transaction.currency)}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                {t('Payments.Transactions.Columns.Currency')}
              </dt>
              <dd className="mt-1 text-sm">{transaction.currency}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                {t('Payments.Transactions.Columns.PaymentMethod')}
              </dt>
              <dd className="mt-1 text-sm">{transaction.paymentMethodId}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                {t('Payments.Transactions.Columns.Provider')}
              </dt>
              <dd className="mt-1 text-sm">{transaction.providerName}</dd>
            </div>
            {transaction.succeededAt && (
              <div>
                <dt className="text-sm font-medium text-muted-foreground">
                  {t('Payments.Transactions.SucceededAt')}
                </dt>
                <dd className="mt-1 text-sm">{formatDateTime(transaction.succeededAt)}</dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>

      <Separator />

      {/* Refunds section */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-foreground">{t('Payments.Refunds.Title')}</h3>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {refundTable.getHeaderGroups().map((headerGroup) => (
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
              {refundTable.getRowModel().rows.length > 0 ? (
                refundTable.getRowModel().rows.map((row) => (
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
                    colSpan={refundColumns.length}
                    className="py-6 text-center text-muted-foreground"
                  >
                    {t('Payments.Refunds.NoRefunds')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Disputes section */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-foreground">{t('Payments.Disputes.Title')}</h3>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {disputeTable.getHeaderGroups().map((headerGroup) => (
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
              {disputeTable.getRowModel().rows.length > 0 ? (
                disputeTable.getRowModel().rows.map((row) => (
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
                    colSpan={disputeColumns.length}
                    className="py-6 text-center text-muted-foreground"
                  >
                    {t('Payments.Disputes.NoDisputes')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Refund dialog */}
      <RefundDialog
        open={refundOpen}
        onOpenChange={setRefundOpen}
        transactionId={transaction.id}
        maxAmount={transaction.amount}
        currency={transaction.currency}
      />
    </div>
  );
}
