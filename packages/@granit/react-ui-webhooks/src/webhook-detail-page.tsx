import { useTranslation } from '@granit/react-localization';
import { QueryProvider } from '@granit/react-query-engine';
import {
  Alert,
  AlertDescription,
  Button,
  Spinner,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@granit/react-ui';
import {
  useActivateSubscription,
  useDeactivateSubscription,
  useDeleteSubscription,
  useRetryDelivery,
  useSubscription,
  useSuspendSubscription,
  useTestPing,
  useUpdateSubscription,
  useWebhookConfig,
  useWebhookStats,
} from '@granit/react-webhooks';
import { WebhookSubscriptionStatus } from '@granit/webhooks';
import { AlertTriangle, ArrowLeft, Info } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useNavigate, useParams } from 'react-router';

import { WebhookDashboard } from './components/webhook-dashboard';
import { WebhookDeliveryTable } from './components/webhook-delivery-table';
import { WebhookLifecycleActions } from './components/webhook-lifecycle-actions';
import { WebhookSigningKeys } from './components/webhook-signing-keys';
import { WebhookStatusBadge } from './components/webhook-status-badge';
import { WebhookSubscriptionForm } from './components/webhook-subscription-form';
import { WebhookTestButton } from './components/webhook-test-button';
import { buildDeliveriesQueryConfig } from './constants';

import type { WebhookSubscriptionFormValues } from './validation';
import type { WebhookSubscriptionTestPingResponse } from '@granit/webhooks';

export function WebhookDetailPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const { data: subscription, isLoading } = useSubscription(id ?? '');
  const { data: config } = useWebhookConfig();
  const { data: stats, isLoading: statsLoading } = useWebhookStats();

  const updateMutation = useUpdateSubscription();
  const activateMutation = useActivateSubscription();
  const suspendMutation = useSuspendSubscription();
  const deactivateMutation = useDeactivateSubscription();
  const deleteMutation = useDeleteSubscription();
  const testMutation = useTestPing();
  const retryMutation = useRetryDelivery();

  const [testResult, setTestResult] = useState<WebhookSubscriptionTestPingResponse | null>(null);

  const handleUpdate = useCallback(
    async (data: WebhookSubscriptionFormValues) => {
      if (!id) return;
      await updateMutation.mutateAsync({ id, request: { targetUrl: data.targetUrl } });
    },
    [id, updateMutation]
  );

  const handleTest = useCallback(async () => {
    if (!id) return;
    const result = await testMutation.mutateAsync(id);
    setTestResult(result);
  }, [id, testMutation]);

  const handleDelete = useCallback(async () => {
    if (!id) return;
    await deleteMutation.mutateAsync(id);
    navigate('/webhooks');
  }, [id, deleteMutation, navigate]);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">{t('Webhooks.Detail.NotFound')}</h2>
        <p className="text-muted-foreground">{t('Webhooks.Detail.NotFoundMessage')}</p>
        <Button variant="outline" onClick={() => navigate('/webhooks')}>
          <ArrowLeft className="mr-2 size-4" />
          {t('Webhooks.Detail.BackToWebhooks')}
        </Button>
      </div>
    );
  }

  return (
    <div data-slot="webhook-detail-page" className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => navigate('/webhooks')}>
          <ArrowLeft className="mr-1 size-4" />
          {t('Webhooks.Detail.BackToWebhooks')}
        </Button>
      </div>

      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-semibold text-foreground">{subscription.targetUrl}</h2>
            <WebhookStatusBadge status={subscription.status} />
          </div>
          <p className="text-sm text-muted-foreground">{subscription.eventType}</p>
        </div>
        <WebhookLifecycleActions
          status={subscription.status}
          onActivate={() => id && activateMutation.mutate(id)}
          onSuspend={() => id && suspendMutation.mutate(id)}
          onDeactivate={(reason) => id && deactivateMutation.mutate({ id, request: { reason } })}
          onDelete={handleDelete}
          isActivating={activateMutation.isPending}
          isSuspending={suspendMutation.isPending}
          isDeactivating={deactivateMutation.isPending}
          isDeleting={deleteMutation.isPending}
        />
      </div>

      {subscription.status === WebhookSubscriptionStatus.Suspended &&
        subscription.consecutiveFailureCount > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="size-4" />
            <AlertDescription>{t('Webhooks.Detail.AutoSuspendedBanner')}</AlertDescription>
          </Alert>
        )}

      <WebhookDashboard stats={stats} isLoading={statsLoading} />

      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">{t('Webhooks.Detail.Tabs.Details')}</TabsTrigger>
          <TabsTrigger value="deliveries">{t('Webhooks.Detail.Tabs.Deliveries')}</TabsTrigger>
          <TabsTrigger value="settings">{t('Webhooks.Detail.Tabs.Settings')}</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-6">
          <WebhookSubscriptionForm
            mode="edit"
            defaultValues={{
              targetUrl: subscription.targetUrl,
              eventType: subscription.eventType,
            }}
            onSubmit={handleUpdate}
            onCancel={() => navigate('/webhooks')}
            isPending={updateMutation.isPending}
          />
        </TabsContent>

        <TabsContent value="deliveries" className="mt-6">
          {id && (
            <QueryProvider config={buildDeliveriesQueryConfig(id)}>
              <WebhookDeliveryTable
                subscriptionId={id}
                onRetry={(delivery) =>
                  retryMutation.mutate({
                    deliveryId: delivery.deliveryId,
                    subscriptionId: id,
                  })
                }
                storePayload={config?.storePayload ?? false}
              />
            </QueryProvider>
          )}
        </TabsContent>

        <TabsContent value="settings" className="mt-6 space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <h3 className="text-lg font-medium">{t('Webhooks.Secret.Title')}</h3>
              {subscription.signingSecretHint && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      aria-label={t('Webhooks.Secret.HintTooltip')}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Info className="size-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    {t('Webhooks.Secret.HintTooltip')}
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{t('Webhooks.Secret.Description')}</p>
            <WebhookSigningKeys
              subscriptionId={id ?? ''}
              signingSecretHint={subscription.signingSecretHint}
            />
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-medium">{t('Webhooks.Actions.SendTest')}</h3>
            <WebhookTestButton
              onTest={handleTest}
              isPending={testMutation.isPending}
              result={testResult}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
