import { WebhookStatusBadge } from './webhook-status-badge';

import type { useTranslation } from '@granit/react-localization';
import type { DataTableColumnDef } from '@granit/react-ui-kit';
import type { WebhookSubscriptionResponse } from '@granit/webhooks';

type TranslateFn = ReturnType<typeof useTranslation>['t'];

export function createSubscriptionColumns({
  t,
  onView,
  formatDate,
  formatDateTime,
}: {
  t: TranslateFn;
  onView: (item: WebhookSubscriptionResponse) => void;
  formatDate: (date: string | Date) => string;
  formatDateTime: (date: string | Date) => string;
}): DataTableColumnDef<WebhookSubscriptionResponse>[] {
  return [
    {
      accessorKey: 'targetUrl',
      header: t('Webhooks.Columns.TargetUrl'),
      cell: ({ row }) => (
        <button
          type="button"
          className="max-w-xs truncate font-medium text-primary hover:underline"
          onClick={() => onView(row.original)}
        >
          {row.original.targetUrl}
        </button>
      ),
    },
    {
      accessorKey: 'eventType',
      header: t('Webhooks.Columns.EventType'),
      cell: ({ row }) => (
        <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{row.original.eventType}</code>
      ),
    },
    {
      accessorKey: 'status',
      header: t('Webhooks.Columns.Status'),
      cell: ({ row }) => <WebhookStatusBadge status={row.original.status} />,
    },
    {
      accessorKey: 'createdAt',
      header: t('Webhooks.Columns.CreatedAt'),
      cell: ({ row }) => formatDate(row.original.createdAt),
    },
    {
      accessorKey: 'lastSuccessAt',
      header: t('Webhooks.Columns.LastSuccessAt'),
      cell: ({ row }) =>
        row.original.lastSuccessAt ? formatDateTime(row.original.lastSuccessAt) : '—',
    },
    {
      accessorKey: 'consecutiveFailureCount',
      header: t('Webhooks.Columns.ConsecutiveFailureCount'),
      cell: ({ row }) => {
        const count = row.original.consecutiveFailureCount;
        return count > 0 ? (
          <span className="font-medium text-destructive">{count}</span>
        ) : (
          <span className="text-muted-foreground">0</span>
        );
      },
    },
  ];
}
