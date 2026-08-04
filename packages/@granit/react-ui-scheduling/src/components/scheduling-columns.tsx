import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@granit/react-ui';
import { ScheduledActionStatus } from '@granit/scheduling';
import { Ban, CalendarClock, Eye, MoreHorizontal } from 'lucide-react';
import { Link } from 'react-router';

import { SchedulingStatusBadge } from './scheduling-status-badge';

import type { useTranslation } from '@granit/react-localization';
import type { ScheduledActionResponse } from '@granit/scheduling';
import type { ColumnDef } from '@tanstack/react-table';

type TranslateFn = ReturnType<typeof useTranslation>['t'];

interface SchedulingColumnOptions {
  readonly t: TranslateFn;
  readonly formatDateTime: (date: string | Date) => string;
  readonly onCancel: (action: ScheduledActionResponse) => void;
  readonly onReschedule: (action: ScheduledActionResponse) => void;
  readonly isMutating?: boolean;
  readonly canManage: boolean;
}

export function createSchedulingColumns({
  t,
  formatDateTime,
  onCancel,
  onReschedule,
  isMutating,
  canManage,
}: SchedulingColumnOptions): ColumnDef<ScheduledActionResponse, unknown>[] {
  return [
    {
      id: 'view',
      header: '',
      enableSorting: false,
      cell: ({ row }: { row: { original: ScheduledActionResponse } }) => (
        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
          <Link
            to={`/scheduling/${row.original.id}`}
            aria-label={`View ${row.original.payloadType}`}
          >
            <Eye className="h-4 w-4" />
          </Link>
        </Button>
      ),
    } satisfies ColumnDef<ScheduledActionResponse, unknown>,
    {
      id: 'payloadType',
      accessorKey: 'payloadType',
      header: t('Scheduling.Columns.PayloadType'),
      enableSorting: true,
      cell: ({ row }) => (
        <span className="font-mono text-sm font-medium text-foreground">
          {row.original.payloadType}
        </span>
      ),
    },
    {
      id: 'status',
      accessorKey: 'status',
      header: t('Scheduling.Columns.Status'),
      enableSorting: true,
      cell: ({ row }) => <SchedulingStatusBadge status={row.original.status} />,
    },
    {
      id: 'executeAt',
      accessorKey: 'executeAt',
      header: t('Scheduling.Columns.ExecuteAt'),
      enableSorting: true,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {formatDateTime(row.original.executeAt)}
        </span>
      ),
    },
    {
      id: 'createdAt',
      accessorKey: 'createdAt',
      header: t('Scheduling.Columns.CreatedAt'),
      enableSorting: true,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {formatDateTime(row.original.createdAt)}
        </span>
      ),
    },
    {
      id: 'executedAt',
      accessorKey: 'executedAt',
      header: t('Scheduling.Columns.ExecutedAt'),
      enableSorting: true,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.executedAt ? formatDateTime(row.original.executedAt) : '—'}
        </span>
      ),
    },
    {
      id: 'correlationId',
      accessorKey: 'correlationId',
      header: t('Scheduling.Columns.CorrelationId'),
      enableSorting: false,
      cell: ({ row }) =>
        row.original.correlationId ? (
          <span className="max-w-[150px] truncate font-mono text-xs text-muted-foreground">
            {row.original.correlationId}
          </span>
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        ),
    },
    ...(canManage
      ? [
          {
            id: 'actions',
            header: '',
            enableSorting: false,
            cell: ({ row }: { row: { original: ScheduledActionResponse } }) => {
              const action = row.original;
              const isPending = action.status === ScheduledActionStatus.Pending;
              if (!isPending) return null;

              return (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      aria-label={`Actions for ${action.payloadType}`}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem disabled={isMutating} onClick={() => onCancel(action)}>
                      <Ban className="mr-2 size-4" />
                      {t('Scheduling.Actions.Cancel')}
                    </DropdownMenuItem>
                    <DropdownMenuItem disabled={isMutating} onClick={() => onReschedule(action)}>
                      <CalendarClock className="mr-2 size-4" />
                      {t('Scheduling.Actions.Reschedule')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              );
            },
          } satisfies ColumnDef<ScheduledActionResponse, unknown>,
        ]
      : []),
  ];
}
