import { useTranslation } from '@granit/react-localization';
import { StatusBadge, type StatusBadgeIntent } from '@granit/react-ui';
import { WebhookSigningKeyStatus } from '@granit/webhooks';

const STATUS_INTENT: Record<WebhookSigningKeyStatus, StatusBadgeIntent> = {
  [WebhookSigningKeyStatus.Active]: 'success',
  [WebhookSigningKeyStatus.Retired]: 'warning',
  [WebhookSigningKeyStatus.Revoked]: 'neutral',
};

const STATUS_LABELS: Record<WebhookSigningKeyStatus, string> = {
  [WebhookSigningKeyStatus.Active]: 'Webhooks.Keys.Status.Active',
  [WebhookSigningKeyStatus.Retired]: 'Webhooks.Keys.Status.Retired',
  [WebhookSigningKeyStatus.Revoked]: 'Webhooks.Keys.Status.Revoked',
};

interface WebhookKeyStatusBadgeProps {
  status: WebhookSigningKeyStatus;
  className?: string;
}

export function WebhookKeyStatusBadge({ status, className }: Readonly<WebhookKeyStatusBadgeProps>) {
  const { t } = useTranslation();

  return (
    <StatusBadge
      data-slot="webhook-key-status-badge"
      intent={STATUS_INTENT[status]}
      className={className}
    >
      {t(STATUS_LABELS[status])}
    </StatusBadge>
  );
}
