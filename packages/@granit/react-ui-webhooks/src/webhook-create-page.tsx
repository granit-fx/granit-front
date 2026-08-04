import { useTranslation } from '@granit/react-localization';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@granit/react-ui';
import { useCreateSubscription } from '@granit/react-webhooks';
import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router';

import { WebhookSecretDisplay } from './components/webhook-secret-display';
import { WebhookSubscriptionForm } from './components/webhook-subscription-form';

import type { WebhookSubscriptionFormValues } from './validation';

export function WebhookCreatePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const createMutation = useCreateSubscription();
  const [createdSecret, setCreatedSecret] = useState<string | null>(null);
  const [createdId, setCreatedId] = useState<string | null>(null);

  const handleSubmit = useCallback(
    async (data: WebhookSubscriptionFormValues) => {
      const result = await createMutation.mutateAsync(data);
      if (result.signingSecret) {
        setCreatedSecret(result.signingSecret);
        setCreatedId(result.id);
      } else {
        navigate(`/webhooks/${result.id}`);
      }
    },
    [createMutation, navigate]
  );

  const handleSecretDialogClose = useCallback(() => {
    setCreatedSecret(null);
    if (createdId) {
      navigate(`/webhooks/${createdId}`);
    }
  }, [createdId, navigate]);

  return (
    <div data-slot="webhook-create-page" className="mx-auto max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">{t('Webhooks.Create')}</h2>
      </div>

      <WebhookSubscriptionForm
        mode="create"
        onSubmit={handleSubmit}
        onCancel={() => navigate('/webhooks')}
        isPending={createMutation.isPending}
      />

      <Dialog open={!!createdSecret} onOpenChange={(open) => !open && handleSecretDialogClose()}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('Webhooks.Secret.Title')}</DialogTitle>
            <DialogDescription>{t('Webhooks.Secret.Description')}</DialogDescription>
          </DialogHeader>
          {createdSecret && <WebhookSecretDisplay secret={createdSecret} isOneTime />}
          <div className="flex justify-end">
            <Button onClick={handleSecretDialogClose}>{t('Common.Close')}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
