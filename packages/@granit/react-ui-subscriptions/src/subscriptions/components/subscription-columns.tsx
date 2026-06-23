import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@granit/react-ui';
import { MoreHorizontal } from 'lucide-react';

import { SubscriptionStatusBadge } from './subscription-status-badge';

import type { useTranslation } from '@granit/react-localization';
import type { SubscriptionResponse } from '@granit/subscriptions';
import type { ColumnDef } from '@tanstack/react-table';

type TranslateFn = ReturnType<typeof useTranslation>['t'];

function truncateId(id: string): string {
  return id.length > 8 ? `${id.slice(0, 8)}\u2026` : id;
}

export function createSubscriptionColumns({
  t,
  onView,
  planNames,
  formatDate,
}: {
  t: TranslateFn;
  onView: (subscription: SubscriptionResponse) => void;
  planNames?: ReadonlyMap<string, string>;
  formatDate: (date: string | Date) => string;
}): ColumnDef<SubscriptionResponse>[] {
  return [
    {
      accessorKey: 'id',
      header: t('Subscriptions.List.Columns.Id'),
      cell: ({ row }) => (
        <button
          type="button"
          className="font-mono text-sm text-primary hover:underline"
          onClick={() => onView(row.original)}
          title={row.original.id}
        >
          {truncateId(row.original.id)}
        </button>
      ),
    },
    {
      accessorKey: 'planId',
      header: t('Subscriptions.List.Columns.PlanId'),
      cell: ({ row }) => {
        const name = planNames?.get(row.original.planId);
        return name ? (
          <span>{name}</span>
        ) : (
          <span className="font-mono text-sm" title={row.original.planId}>
            {truncateId(row.original.planId)}
          </span>
        );
      },
    },
    {
      accessorKey: 'status',
      header: t('Subscriptions.List.Columns.Status'),
      cell: ({ row }) => <SubscriptionStatusBadge status={row.original.status} />,
    },
    {
      accessorKey: 'currentPeriodStart',
      header: () => (
        <div className="text-center">{t('Subscriptions.List.Columns.PeriodStart')}</div>
      ),
      cell: ({ row }) => (
        <div className="text-center">{formatDate(row.original.currentPeriodStart)}</div>
      ),
    },
    {
      accessorKey: 'currentPeriodEnd',
      header: () => <div className="text-center">{t('Subscriptions.List.Columns.PeriodEnd')}</div>,
      cell: ({ row }) => (
        <div className="text-center">{formatDate(row.original.currentPeriodEnd)}</div>
      ),
    },
    {
      accessorKey: 'seatCount',
      header: t('Subscriptions.List.Columns.Seats'),
    },
    {
      id: 'actions',
      header: '',
      enableSorting: false,
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label={t('Common.Actions')}>
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onView(row.original)}>
              {t('Common.ViewDetails')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];
}
