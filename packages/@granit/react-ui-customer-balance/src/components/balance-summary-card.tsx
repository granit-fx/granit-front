import { useDateFormatter, useTranslation } from '@granit/react-localization';
import { Card, CardContent, CardHeader, CardTitle } from '@granit/react-ui';
import { formatCurrency } from '@granit/utils';

import type { CustomerBalanceResponse } from '@granit/customer-balance';

interface BalanceSummaryCardProps {
  readonly balance: CustomerBalanceResponse;
}

export function BalanceSummaryCard({ balance }: BalanceSummaryCardProps) {
  const { t, i18n } = useTranslation();
  const { formatDateTime } = useDateFormatter();

  return (
    <Card data-slot="balance-summary-card">
      <CardHeader>
        <CardTitle>{t('CustomerBalance.Summary')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground">{t('CustomerBalance.CurrentBalance')}</p>
          <p className="text-3xl font-bold text-foreground">
            {formatCurrency(balance.balance, balance.currency, i18n.language)}
          </p>
        </div>
        <div className="flex items-center gap-6">
          <div>
            <p className="text-sm text-muted-foreground">{t('CustomerBalance.Currency')}</p>
            <p className="text-lg font-semibold text-foreground">{balance.currency}</p>
          </div>
        </div>
        {balance.updatedAt && (
          <p className="text-xs text-muted-foreground">
            {t('CustomerBalance.LastUpdated')}: {formatDateTime(balance.updatedAt)}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
