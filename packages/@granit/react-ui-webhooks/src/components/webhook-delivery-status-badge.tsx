import { useTranslation } from '@granit/react-localization';
import { cn } from '@granit/utils';
import { cva } from 'class-variance-authority';

type DeliveryStatus = 'success' | 'failure' | 'pending';

const deliveryStatusBadgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
  {
    variants: {
      status: {
        success: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
        failure: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
        pending: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
      },
    },
    defaultVariants: {
      status: 'pending',
    },
  }
);

const STATUS_LABELS: Record<DeliveryStatus, string> = {
  success: 'Webhooks.Deliveries.Success',
  failure: 'Webhooks.Deliveries.Failure',
  pending: 'Webhooks.Deliveries.Pending',
};

function resolveDeliveryStatus(isSuccess: boolean, httpStatusCode: number | null): DeliveryStatus {
  if (httpStatusCode === null) return 'pending';
  return isSuccess ? 'success' : 'failure';
}

interface WebhookDeliveryStatusBadgeProps {
  isSuccess: boolean;
  httpStatusCode: number | null;
  className?: string;
}

export function WebhookDeliveryStatusBadge({
  isSuccess,
  httpStatusCode,
  className,
}: Readonly<WebhookDeliveryStatusBadgeProps>) {
  const { t } = useTranslation();
  const status = resolveDeliveryStatus(isSuccess, httpStatusCode);

  return (
    <span
      data-slot="webhook-delivery-status-badge"
      className={cn(deliveryStatusBadgeVariants({ status }), className)}
    >
      {httpStatusCode !== null && <span className="mr-1 font-mono">{httpStatusCode}</span>}
      {t(STATUS_LABELS[status])}
    </span>
  );
}
