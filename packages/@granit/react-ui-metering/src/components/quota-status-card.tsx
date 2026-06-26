import { useTranslation } from '@granit/react-localization';
import { Card, CardContent, CardHeader, CardTitle } from '@granit/react-ui';
import { cn } from '@granit/utils';

import type { MeteringQuotaStatusResponse } from '@granit/metering';

interface QuotaStatusCardProps {
  quota: MeteringQuotaStatusResponse;
}

function getQuotaColor(percent: number): string {
  if (percent > 95) return 'bg-destructive';
  if (percent >= 80) return 'bg-yellow-500';
  return 'bg-success-500';
}

function getQuotaTextColor(percent: number): string {
  if (percent > 95) return 'text-destructive';
  if (percent >= 80) return 'text-yellow-600 dark:text-yellow-500';
  return 'text-success';
}

export function QuotaStatusCard({ quota }: Readonly<QuotaStatusCardProps>) {
  const { t } = useTranslation();
  const percentUsed = quota.percentUsed ?? 0;
  const clampedPercent = Math.min(percentUsed, 100);

  return (
    <Card data-slot="quota-status-card">
      <CardHeader>
        <CardTitle className="text-base">{t('Metering.Quota.Title')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-baseline justify-between">
          <span className={cn('text-2xl font-bold', getQuotaTextColor(percentUsed))}>
            {percentUsed.toFixed(1)}%
          </span>
          <span className="text-sm text-muted-foreground">
            {quota.currentUsage.toLocaleString()} / {quota.limit?.toLocaleString() ?? '∞'} (
            {quota.meterName})
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={cn('h-full rounded-full transition-all', getQuotaColor(percentUsed))}
            style={{ width: `${clampedPercent}%` }}
          />
        </div>

        {quota.isExceeded && (
          <p className="text-sm font-medium text-destructive">{t('Metering.Quota.Exceeded')}</p>
        )}
      </CardContent>
    </Card>
  );
}
