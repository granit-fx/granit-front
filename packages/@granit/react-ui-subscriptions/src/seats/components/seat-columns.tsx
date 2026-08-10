import { Button } from '@granit/react-ui';

import type { useTranslation } from '@granit/react-localization';
import type { DataTableColumnDef } from '@granit/react-ui-kit';
import type { SeatResponse } from '@granit/subscriptions';

type TranslateFn = ReturnType<typeof useTranslation>['t'];

export function createSeatColumns({
  t,
  onRevoke,
  formatDate,
}: {
  t: TranslateFn;
  onRevoke: (seat: SeatResponse) => void;
  formatDate: (date: string | Date) => string;
}): DataTableColumnDef<SeatResponse>[] {
  return [
    {
      accessorKey: 'userId',
      header: t('Subscriptions.Seats.Columns.User'),
      cell: ({ row }) => <span className="font-medium">{row.original.userId}</span>,
    },
    {
      accessorKey: 'assignedAt',
      header: t('Subscriptions.Seats.Columns.AssignedAt'),
      cell: ({ row }) => formatDate(row.original.assignedAt),
    },
    {
      id: 'actions',
      header: '',
      enableSorting: false,
      cell: ({ row }) => (
        <div className="text-right">
          <Button variant="ghost" size="sm" onClick={() => onRevoke(row.original)}>
            {t('Subscriptions.Seats.Revoke')}
          </Button>
        </div>
      ),
    },
  ];
}
