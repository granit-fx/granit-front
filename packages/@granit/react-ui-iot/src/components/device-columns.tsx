import { Badge, Button } from '@granit/react-ui';
import { cn } from '@granit/utils';
import { Eye } from 'lucide-react';

import type { Device, DeviceStatus } from '@granit/iot';
import type { useDateFormatter, useTranslation } from '@granit/react-localization';
import type { DataTableColumnDef } from '@granit/react-ui-kit';

// Type `t` off useTranslation's return rather than importing `TFunction` from
// i18next directly — keeps the column factory immune to i18next version skew.
type TranslateFn = ReturnType<typeof useTranslation>['t'];
type FormatDateTimeFn = ReturnType<typeof useDateFormatter>['formatDateTime'];

interface DeviceColumnOptions {
  readonly t: TranslateFn;
  readonly formatDateTime: FormatDateTimeFn;
  readonly onViewDetail: (id: string) => void;
}

/** Maps a device status to the badge classes conveying its severity. */
function statusClasses(status: DeviceStatus): string {
  switch (status) {
    case 'Active':
      return 'bg-success-500/15 text-success border-success-500/25';
    case 'Suspended':
      return 'bg-warning-500/15 text-warning border-warning-500/25';
    case 'Decommissioned':
      return 'bg-destructive/10 text-destructive border-destructive/25';
    default:
      return 'bg-muted/50 text-muted-foreground';
  }
}

export function createDeviceColumns({
  t,
  formatDateTime,
  onViewDetail,
}: DeviceColumnOptions): DataTableColumnDef<Device, unknown>[] {
  return [
    {
      id: 'serialNumber',
      accessorKey: 'serialNumber',
      header: t('IoT.Columns.SerialNumber'),
      enableSorting: true,
      cell: ({ row }) => (
        <span className="text-sm font-medium text-foreground">{row.original.serialNumber}</span>
      ),
    },
    {
      id: 'model',
      accessorKey: 'model',
      header: t('IoT.Columns.Model'),
      enableSorting: true,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.original.model}</span>
      ),
    },
    {
      id: 'firmware',
      accessorKey: 'firmware',
      header: t('IoT.Columns.Firmware'),
      enableSorting: true,
      cell: ({ row }) => (
        <Badge variant="outline" className="text-xs">
          {row.original.firmware}
        </Badge>
      ),
    },
    {
      id: 'status',
      accessorKey: 'status',
      header: t('IoT.Columns.Status'),
      enableSorting: true,
      cell: ({ row }) => {
        const status = row.original.status;
        return (
          <Badge variant="secondary" className={cn('text-xs', statusClasses(status))}>
            {t(`IoT.Status.${status}`)}
          </Badge>
        );
      },
    },
    {
      id: 'label',
      accessorKey: 'label',
      header: t('IoT.Columns.Label'),
      enableSorting: false,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.original.label ?? '—'}</span>
      ),
    },
    {
      id: 'lastHeartbeatAt',
      accessorKey: 'lastHeartbeatAt',
      header: t('IoT.Columns.LastHeartbeat'),
      enableSorting: true,
      cell: ({ row }) => {
        const value = row.original.lastHeartbeatAt;
        return (
          <span className="text-sm text-muted-foreground">
            {value ? formatDateTime(value) : '—'}
          </span>
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
          aria-label={`${t('IoT.Actions.ViewDetail')} ${row.original.serialNumber}`}
          onClick={() => onViewDetail(row.original.id)}
        >
          <Eye className="h-4 w-4" />
        </Button>
      ),
    },
  ];
}
