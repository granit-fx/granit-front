import { Badge } from '@granit/react-ui';

import type { DataTableColumnDef } from '@granit/react-ui-kit';
import type { TFunction } from 'i18next';

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';

/** Fields shared by refund and dispute rows, all this factory needs to render. */
interface PaymentHistoryRow {
  readonly id: string;
  readonly status: string;
  readonly amount: number;
  readonly reason: string | null;
  readonly createdAt: string | Date;
}

interface PaymentHistoryColumnOptions<TStatus extends string> {
  readonly t: TFunction;
  readonly formatDateTime: (date: string | Date) => string;
  /** i18n namespace for the column headers, e.g. `Payments.Refunds`. */
  readonly i18nPrefix: string;
  /** Badge variant per status value. */
  readonly statusVariant: Record<TStatus, BadgeVariant>;
}

/**
 * Column factory shared by the refund and dispute history tables — both render
 * the same id / status / amount / reason / date shape, differing only in their
 * i18n namespace and status→badge mapping.
 */
export function createPaymentHistoryColumns<
  TRow extends PaymentHistoryRow,
  TStatus extends string,
>({
  t,
  formatDateTime,
  i18nPrefix,
  statusVariant,
}: PaymentHistoryColumnOptions<TStatus>): DataTableColumnDef<TRow, unknown>[] {
  return [
    {
      id: 'id',
      accessorKey: 'id',
      header: t(`${i18nPrefix}.Columns.Id`),
      cell: ({ row }) => (
        <span className="font-mono text-sm text-muted-foreground">{row.original.id}</span>
      ),
    },
    {
      id: 'status',
      accessorKey: 'status',
      header: t(`${i18nPrefix}.Columns.Status`),
      cell: ({ row }) => (
        <Badge variant={statusVariant[row.original.status as TStatus] ?? 'secondary'}>
          {row.original.status}
        </Badge>
      ),
    },
    {
      id: 'amount',
      accessorKey: 'amount',
      header: t(`${i18nPrefix}.Columns.Amount`),
      cell: ({ row }) => (
        <span className="text-sm font-medium">
          {new Intl.NumberFormat('en', { style: 'currency', currency: 'EUR' }).format(
            row.original.amount / 100
          )}
        </span>
      ),
    },
    {
      id: 'reason',
      accessorKey: 'reason',
      header: t(`${i18nPrefix}.Columns.Reason`),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.original.reason}</span>
      ),
    },
    {
      id: 'createdAt',
      accessorKey: 'createdAt',
      header: t(`${i18nPrefix}.Columns.CreatedAt`),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {formatDateTime(row.original.createdAt)}
        </span>
      ),
    },
  ];
}
