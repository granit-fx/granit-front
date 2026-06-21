import { Badge } from '@granit/react-ui';
import { cn } from '@granit/utils';

import type { BalanceTransactionResponse } from '@granit/customer-balance';
import type { useTranslation } from '@granit/react-localization';
import type { ColumnDef } from '@tanstack/react-table';

/** The `t` produced by react-localization's `useTranslation` — derived from the
 * hook itself so the column factory's type always matches the caller's, free of
 * any i18next version skew across the workspace. */
type TranslateFn = ReturnType<typeof useTranslation>['t'];

function formatAmount(amount: number, locale: string): string {
  return new Intl.NumberFormat(locale, { minimumFractionDigits: 2 }).format(amount / 100);
}

interface TransactionColumnOptions {
  readonly t: TranslateFn;
  readonly formatDateTime: (date: string | Date) => string;
  readonly locale: string;
}

export function createTransactionColumns({
  t,
  formatDateTime,
  locale,
}: TransactionColumnOptions): ColumnDef<BalanceTransactionResponse, unknown>[] {
  return [
    {
      id: 'createdAt',
      accessorKey: 'createdAt',
      header: t('CustomerBalance.Columns.Date'),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {formatDateTime(row.original.createdAt)}
        </span>
      ),
    },
    {
      id: 'type',
      accessorKey: 'type',
      header: t('CustomerBalance.Columns.Type'),
      cell: ({ row }) => {
        const isCredit = row.original.type === 'Credit';
        return (
          <Badge variant={isCredit ? 'default' : 'destructive'}>
            {isCredit ? t('CustomerBalance.Credit') : t('CustomerBalance.Debit')}
          </Badge>
        );
      },
    },
    {
      id: 'amount',
      accessorKey: 'amount',
      header: t('CustomerBalance.Columns.Amount'),
      cell: ({ row }) => {
        const { amount, type } = row.original;
        const isCredit = type === 'Credit';
        return (
          <span
            className={cn(
              'text-sm font-medium',
              isCredit ? 'text-success-600 dark:text-success-500' : 'text-destructive'
            )}
          >
            {isCredit ? '+' : ''}
            {formatAmount(amount, locale)}
          </span>
        );
      },
    },
    {
      id: 'reason',
      accessorKey: 'reason',
      header: t('CustomerBalance.Columns.Description'),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.original.reason}</span>
      ),
    },
    {
      id: 'referenceId',
      accessorKey: 'referenceId',
      header: t('CustomerBalance.Columns.Reference'),
      cell: ({ row }) => (
        <span className="font-mono text-sm text-muted-foreground">
          {row.original.referenceId ?? '—'}
        </span>
      ),
    },
  ];
}
