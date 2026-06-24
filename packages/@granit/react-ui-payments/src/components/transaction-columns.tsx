import { Button } from '@granit/react-ui';
import { formatCurrency } from '@granit/utils';
import { Eye } from 'lucide-react';
import { Link } from 'react-router-dom';

import { TransactionStatusBadge } from './transaction-status-badge';

import type { PaymentTransactionResponse } from '@granit/payments';
import type { ColumnDef } from '@tanstack/react-table';
import type { TFunction } from 'i18next';

interface TransactionColumnOptions {
  readonly t: TFunction;
  readonly locale?: string;
}

export function createTransactionColumns({
  t,
  locale,
}: TransactionColumnOptions): ColumnDef<PaymentTransactionResponse, unknown>[] {
  return [
    {
      id: 'id',
      accessorKey: 'id',
      header: t('Payments.Transactions.Columns.Id'),
      cell: ({ row }) => (
        <span className="font-mono text-sm text-muted-foreground">
          {row.original.id.slice(0, 12)}...
        </span>
      ),
    },
    {
      id: 'status',
      accessorKey: 'status',
      header: t('Payments.Transactions.Columns.Status'),
      cell: ({ row }) => <TransactionStatusBadge status={row.original.status} />,
    },
    {
      id: 'amount',
      accessorKey: 'amount',
      header: t('Payments.Transactions.Columns.Amount'),
      cell: ({ row }) => (
        <span className="text-sm font-medium">
          {formatCurrency(row.original.amount, row.original.currency, locale)}
        </span>
      ),
    },
    {
      id: 'currency',
      accessorKey: 'currency',
      header: t('Payments.Transactions.Columns.Currency'),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.original.currency}</span>
      ),
    },
    {
      id: 'paymentMethodId',
      accessorKey: 'paymentMethodId',
      header: t('Payments.Transactions.Columns.PaymentMethod'),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.original.paymentMethodId}</span>
      ),
    },
    {
      id: 'providerName',
      accessorKey: 'providerName',
      header: t('Payments.Transactions.Columns.Provider'),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.original.providerName}</span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <Button variant="ghost" size="icon" asChild>
          <Link to={`/payments/transactions/${row.original.id}`}>
            <Eye className="h-4 w-4" />
            <span className="sr-only">{t('Payments.Transactions.ViewDetail')}</span>
          </Link>
        </Button>
      ),
    },
  ];
}
