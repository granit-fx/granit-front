import { useTranslation } from '@granit/react-localization';
import { cn } from '@granit/utils';
import { WebhookSubscriptionStatus } from '@granit/webhooks';
import { cva } from 'class-variance-authority';

const webhookStatusBadgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
  {
    variants: {
      status: {
        [WebhookSubscriptionStatus.Active]:
          'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
        [WebhookSubscriptionStatus.Suspended]:
          'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
        [WebhookSubscriptionStatus.Deactivated]:
          'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
      },
    },
    defaultVariants: {
      status: WebhookSubscriptionStatus.Active,
    },
  }
);

const STATUS_LABELS: Record<WebhookSubscriptionStatus, string> = {
  [WebhookSubscriptionStatus.Active]: 'Webhooks.Status.Active',
  [WebhookSubscriptionStatus.Suspended]: 'Webhooks.Status.Suspended',
  [WebhookSubscriptionStatus.Deactivated]: 'Webhooks.Status.Deactivated',
};

interface WebhookStatusBadgeProps {
  status: WebhookSubscriptionStatus;
  className?: string;
}

export function WebhookStatusBadge({ status, className }: Readonly<WebhookStatusBadgeProps>) {
  const { t } = useTranslation();

  return (
    <span
      data-slot="webhook-status-badge"
      className={cn(webhookStatusBadgeVariants({ status }), className)}
    >
      {t(STATUS_LABELS[status])}
    </span>
  );
}
