import { useTranslation } from '@granit/react-localization';
import { Card, CardContent, CardHeader, CardTitle } from '@granit/react-ui';

import type { UsageAggregateResponse } from '@granit/metering';

interface UsageSummaryCardProps {
  usage: UsageAggregateResponse;
}

export function UsageSummaryCard({ usage }: Readonly<UsageSummaryCardProps>) {
  const { t } = useTranslation();

  return (
    <Card data-slot="usage-summary-card">
      <CardHeader>
        <CardTitle className="text-base">{t('Metering.Usage.Title')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="text-4xl font-bold text-foreground">
          {usage.aggregatedValue.toLocaleString()}
        </div>
        <div className="text-sm text-muted-foreground">
          {t('Metering.Usage.Period')}: {usage.period}
        </div>
        <div className="text-sm text-muted-foreground">
          {t('Metering.Usage.EventCount')}: {usage.eventCount.toLocaleString()}
        </div>
      </CardContent>
    </Card>
  );
}
