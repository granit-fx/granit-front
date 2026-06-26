import { Badge, Button } from '@granit/react-ui';
import { cn } from '@granit/utils';
import { Eye } from 'lucide-react';

import type { MeterDefinitionResponse } from '@granit/metering';
import type { useTranslation } from '@granit/react-localization';
import type { ColumnDef } from '@tanstack/react-table';

// Type `t` off useTranslation's return rather than importing `TFunction` from
// i18next directly — keeps the column factory immune to i18next version skew.
type TranslateFn = ReturnType<typeof useTranslation>['t'];

interface MeterColumnOptions {
  readonly t: TranslateFn;
  readonly onViewDetail: (id: string) => void;
}

export function createMeterColumns({
  t,
  onViewDetail,
}: MeterColumnOptions): ColumnDef<MeterDefinitionResponse, unknown>[] {
  return [
    {
      id: 'name',
      accessorKey: 'name',
      header: t('Metering.Columns.Name'),
      enableSorting: true,
      cell: ({ row }) => (
        <span className="text-sm font-medium text-foreground">{row.original.name}</span>
      ),
    },
    {
      id: 'aggregationType',
      accessorKey: 'aggregationType',
      header: t('Metering.Columns.AggregationType'),
      enableSorting: false,
      cell: ({ row }) => (
        <Badge variant="outline" className="text-xs">
          {row.original.aggregationType}
        </Badge>
      ),
    },
    {
      id: 'unit',
      accessorKey: 'unit',
      header: t('Metering.Columns.Unit'),
      enableSorting: false,
      cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.unit}</span>,
    },
    {
      id: 'lifecycleStatus',
      accessorKey: 'lifecycleStatus',
      header: t('Metering.Columns.Status'),
      enableSorting: false,
      cell: ({ row }) => {
        const status = row.original.lifecycleStatus;
        const published = status === 'Published';
        return (
          <Badge
            variant={published ? 'default' : 'secondary'}
            className={cn(
              'text-xs',
              published
                ? 'bg-success-500/15 text-success border-success-500/25'
                : 'bg-muted/50 text-muted-foreground'
            )}
          >
            {t(`Metering.Status.${status}`)}
          </Badge>
        );
      },
    },
    {
      id: 'actions',
      header: '',
      enableSorting: false,
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          aria-label={`${t('Metering.Actions.ViewDetail')} ${row.original.name}`}
          onClick={() => onViewDetail(row.original.id)}
        >
          <Eye className="h-4 w-4" />
        </Button>
      ),
    },
  ];
}
