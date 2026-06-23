import { useTranslation } from '@granit/react-localization';
import { Button } from '@granit/react-ui';
import { RotateCcw } from 'lucide-react';

import type { WebhookDeliveryAttemptResponse } from '@granit/webhooks';

interface WebhookDeliveryActionsProps {
  delivery: WebhookDeliveryAttemptResponse;
  onRetry: (delivery: WebhookDeliveryAttemptResponse) => void;
  onViewPayload?: (delivery: WebhookDeliveryAttemptResponse) => void;
  storePayload: boolean;
}

export function WebhookDeliveryActions({
  delivery,
  onRetry,
  onViewPayload,
  storePayload,
}: Readonly<WebhookDeliveryActionsProps>) {
  const { t } = useTranslation();

  return (
    <div data-slot="webhook-delivery-actions" className="flex items-center gap-1">
      {!delivery.isSuccess && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onRetry(delivery)}
          aria-label={t('Webhooks.Actions.Retry')}
        >
          <RotateCcw className="mr-1 size-3.5" />
          {t('Webhooks.Actions.Retry')}
        </Button>
      )}
      {storePayload && delivery.payload && onViewPayload && (
        <Button variant="ghost" size="sm" onClick={() => onViewPayload(delivery)}>
          {t('Webhooks.Deliveries.ViewPayload')}
        </Button>
      )}
    </div>
  );
}
