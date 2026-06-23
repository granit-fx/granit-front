import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@granit/react-ui';
import { MoreHorizontal } from 'lucide-react';

import { PlanStatusBadge } from './plan-status-badge';

import type { PlanQueryItem } from '../types';
import type { useTranslation } from '@granit/react-localization';
import type { ColumnDef } from '@tanstack/react-table';

type TranslateFn = ReturnType<typeof useTranslation>['t'];

export function createPlanColumns({
  t,
  formatDate,
  onView,
}: {
  t: TranslateFn;
  formatDate: (value: string) => string;
  onView: (plan: { id: string }) => void;
}): ColumnDef<PlanQueryItem>[] {
  return [
    {
      accessorKey: 'name',
      header: t('Subscriptions.Plans.Columns.Name'),
      cell: ({ row }) => (
        <button
          type="button"
          className="font-medium text-primary hover:underline"
          onClick={() => onView(row.original)}
        >
          {row.original.name}
        </button>
      ),
    },
    {
      accessorKey: 'pricingModel',
      header: t('Subscriptions.Plans.Columns.PricingModel'),
      cell: ({ row }) => t(`Subscriptions.PricingModel.${row.original.pricingModel}`),
    },
    {
      accessorKey: 'defaultInterval',
      header: t('Subscriptions.Plans.Columns.DefaultInterval'),
      cell: ({ row }) => t(`Subscriptions.BillingInterval.${row.original.defaultInterval}`),
    },
    {
      accessorKey: 'lifecycleStatus',
      header: t('Subscriptions.Plans.Columns.Status'),
      cell: ({ row }) => <PlanStatusBadge status={row.original.lifecycleStatus} />,
    },
    {
      accessorKey: 'createdAt',
      header: t('Subscriptions.Plans.Columns.CreatedAt'),
      cell: ({ row }) => formatDate(row.original.createdAt),
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
