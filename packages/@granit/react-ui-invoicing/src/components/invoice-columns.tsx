import { Button } from '@granit/react-ui';
import { formatCurrency } from '@granit/utils';
import { Eye } from 'lucide-react';

import { InvoiceStatusBadge } from './invoice-status-badge';

import type { InvoiceResponse } from '@granit/invoicing';
import type { useTranslation } from '@granit/react-localization';
import type { ColumnDef } from '@tanstack/react-table';

type TranslateFn = ReturnType<typeof useTranslation>['t'];

interface InvoiceColumnOptions {
  readonly t: TranslateFn;
  readonly onViewDetail: (id: string) => void;
  readonly formatDate: (date: string | Date) => string;
  readonly locale: string;
}

export function createInvoiceColumns({
  t,
  onViewDetail,
  formatDate,
  locale,
}: InvoiceColumnOptions): ColumnDef<InvoiceResponse, unknown>[] {
  return [
    {
      id: 'invoiceNumber',
      accessorKey: 'invoiceNumber',
      header: t('Invoicing.Columns.InvoiceNumber'),
      cell: ({ row }) => <span className="font-mono text-sm">{row.original.invoiceNumber}</span>,
    },
    {
      id: 'status',
      accessorKey: 'status',
      header: t('Invoicing.Columns.Status'),
      cell: ({ row }) => <InvoiceStatusBadge status={row.original.status} />,
    },
    {
      id: 'amount',
      accessorKey: 'total',
      header: t('Invoicing.Columns.Amount'),
      cell: ({ row }) => (
        <span className="text-sm font-medium">
          {formatCurrency(row.original.total, row.original.currency, locale)}
        </span>
      ),
    },
    {
      id: 'currency',
      accessorKey: 'currency',
      header: t('Invoicing.Columns.Currency'),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.original.currency}</span>
      ),
    },
    {
      id: 'dueAt',
      accessorKey: 'dueAt',
      header: t('Invoicing.Columns.DueDate'),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.dueAt ? formatDate(row.original.dueAt) : '—'}
        </span>
      ),
    },
    {
      id: 'issuedAt',
      accessorKey: 'issuedAt',
      header: t('Invoicing.Columns.IssuedAt'),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.issuedAt ? formatDate(row.original.issuedAt) : '—'}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onViewDetail(row.original.id)}
          aria-label={t('Invoicing.ViewDetail')}
        >
          <Eye className="h-4 w-4" />
        </Button>
      ),
    },
  ];
}
