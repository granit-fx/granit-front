import { WebhookDeliveryActions } from './webhook-delivery-actions';
import { WebhookDeliveryStatusBadge } from './webhook-delivery-status-badge';

import type { useTranslation } from '@granit/react-localization';
import type { DataTableColumnDef } from '@granit/react-ui-kit';
import type { WebhookDeliveryAttemptResponse } from '@granit/webhooks';

type TranslateFn = ReturnType<typeof useTranslation>['t'];

export function createDeliveryColumns({
  t,
  onRetry,
  onViewPayload,
  storePayload,
  formatDateTime,
}: {
  t: TranslateFn;
  onRetry: (delivery: WebhookDeliveryAttemptResponse) => void;
  onViewPayload?: (delivery: WebhookDeliveryAttemptResponse) => void;
  storePayload: boolean;
  formatDateTime: (date: string | Date) => string;
}): DataTableColumnDef<WebhookDeliveryAttemptResponse>[] {
  return [
    {
      accessorKey: 'eventType',
      header: t('Webhooks.Deliveries.Columns.EventType'),
      cell: ({ row }) => (
        <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{row.original.eventType}</code>
      ),
    },
    {
      accessorKey: 'httpStatusCode',
      header: t('Webhooks.Deliveries.Columns.HttpStatusCode'),
      cell: ({ row }) => (
        <WebhookDeliveryStatusBadge
          isSuccess={row.original.isSuccess}
          httpStatusCode={row.original.httpStatusCode}
        />
      ),
    },
    {
      accessorKey: 'occurredAt',
      header: t('Webhooks.Deliveries.Columns.OccurredAt'),
      cell: ({ row }) => formatDateTime(row.original.occurredAt),
    },
    {
      accessorKey: 'durationMs',
      header: t('Webhooks.Deliveries.Columns.DurationMs'),
      cell: ({ row }) => t('Webhooks.Deliveries.Duration', { ms: row.original.durationMs }),
    },
    {
      id: 'actions',
      header: t('Common.Actions'),
      cell: ({ row }) => (
        <WebhookDeliveryActions
          delivery={row.original}
          onRetry={onRetry}
          onViewPayload={onViewPayload}
          storePayload={storePayload}
        />
      ),
    },
  ];
}
