import { useTranslation } from '@granit/react-localization';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@granit/react-ui';
import { Check, ClipboardCopy } from 'lucide-react';
import { useCallback, useState } from 'react';

import { logger } from '../logger';

import type { WebhookDeliveryAttemptResponse } from '@granit/webhooks';

interface WebhookPayloadViewerProps {
  delivery: WebhookDeliveryAttemptResponse;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WebhookPayloadViewer({
  delivery,
  open,
  onOpenChange,
}: Readonly<WebhookPayloadViewerProps>) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const formattedPayload = delivery.payload
    ? (() => {
        try {
          return JSON.stringify(JSON.parse(delivery.payload), null, 2);
        } catch (err) {
          // Non-JSON payload — show it verbatim rather than failing.
          logger.error('[WebhookPayloadViewer] Failed to pretty-print payload', err);
          return delivery.payload;
        }
      })()
    : null;

  const handleCopy = useCallback(async () => {
    if (formattedPayload) {
      await navigator.clipboard.writeText(formattedPayload);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [formattedPayload]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-slot="webhook-payload-viewer" className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('Webhooks.Deliveries.PayloadTitle')}</DialogTitle>
          <DialogDescription>{t('Webhooks.Deliveries.PayloadDescription')}</DialogDescription>
        </DialogHeader>

        {formattedPayload ? (
          <div className="space-y-3">
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={handleCopy}>
                {copied ? (
                  <Check className="mr-1 size-3.5 text-green-600" />
                ) : (
                  <ClipboardCopy className="mr-1 size-3.5" />
                )}
                {t(copied ? 'Webhooks.Secret.Copied' : 'Webhooks.Secret.CopySecret')}
              </Button>
            </div>
            <pre className="max-h-96 overflow-auto rounded-md bg-muted p-4 text-sm">
              <code>{formattedPayload}</code>
            </pre>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            {t('Webhooks.Deliveries.PayloadUnavailable')}
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
