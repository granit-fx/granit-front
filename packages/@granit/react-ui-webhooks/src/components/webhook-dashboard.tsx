import { useTranslation } from '@granit/react-localization';
import { Card, CardContent, CardHeader, CardTitle, Spinner } from '@granit/react-ui';
import { cn } from '@granit/utils';

import type { WebhookSubscriptionStatsResponse } from '@granit/webhooks';

interface WebhookDashboardProps {
  stats?: WebhookSubscriptionStatsResponse;
  isLoading: boolean;
}

export function WebhookDashboard({ stats, isLoading }: Readonly<WebhookDashboardProps>) {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!stats) return null;

  const successRate = stats.successRateLast24h;
  let successRateColor = 'text-destructive';
  if (successRate >= 95) successRateColor = 'text-success';
  else if (successRate >= 80) successRateColor = 'text-warning';

  const cards = [
    {
      label: t('Webhooks.Dashboard.TotalSubscriptions'),
      value: stats.totalSubscriptions,
    },
    {
      label: t('Webhooks.Dashboard.ActiveSubscriptions'),
      value: stats.activeCount,
      valueClass: 'text-success',
    },
    {
      label: t('Webhooks.Dashboard.SuspendedSubscriptions'),
      value: stats.suspendedCount,
      valueClass: stats.suspendedCount > 0 ? 'text-warning' : undefined,
    },
    {
      label: t('Webhooks.Dashboard.DeliveriesLast24h'),
      value: stats.deliveriesLast24h,
    },
    {
      label: t('Webhooks.Dashboard.SuccessRate'),
      value: `${successRate.toFixed(1)}%`,
      valueClass: successRateColor,
    },
    {
      label: t('Webhooks.Dashboard.AvgResponseTime'),
      value: `${stats.avgResponseTimeMsLast24h}ms`,
    },
  ];

  return (
    <div
      data-slot="webhook-dashboard"
      className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6"
    >
      {cards.map((card) => (
        <Card key={card.label}>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              {card.label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={cn('text-2xl font-bold', card.valueClass ?? 'text-foreground')}>
              {card.value}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
