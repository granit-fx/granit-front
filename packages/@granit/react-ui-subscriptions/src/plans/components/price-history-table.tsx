import { useDateFormatter, useTranslation } from '@granit/react-localization';
import {
  Badge,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@granit/react-ui';

import { formatCurrency } from '../../format-currency';

import type { PlanPriceResponse } from '@granit/subscriptions';

const SKELETON_ROW_KEYS = ['s0', 's1', 's2'] as const;

interface PriceHistoryTableProps {
  readonly prices: PlanPriceResponse[];
  readonly isLoading?: boolean;
}

export function PriceHistoryTable({ prices, isLoading }: PriceHistoryTableProps) {
  const { t, i18n } = useTranslation();
  const { formatDate } = useDateFormatter();

  if (isLoading) {
    return (
      <div data-slot="price-history-table" className="space-y-2">
        {SKELETON_ROW_KEYS.map((key) => (
          <Skeleton key={key} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  if (prices.length === 0) {
    return (
      <div
        data-slot="price-history-table"
        className="rounded-lg border border-dashed p-8 text-center text-muted-foreground"
      >
        {t('Subscriptions.Plans.NoPriceHistory')}
      </div>
    );
  }

  return (
    <div data-slot="price-history-table" className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('Subscriptions.Plans.PriceColumns.Version')}</TableHead>
            <TableHead>{t('Subscriptions.Plans.PriceColumns.Amount')}</TableHead>
            <TableHead>{t('Subscriptions.Plans.PriceColumns.Currency')}</TableHead>
            <TableHead>{t('Subscriptions.Plans.PriceColumns.EffectiveFrom')}</TableHead>
            <TableHead>{t('Subscriptions.Plans.PriceColumns.EffectiveTo')}</TableHead>
            <TableHead>{t('Subscriptions.Plans.PriceColumns.Status')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {prices.map((price) => (
            <TableRow key={price.id}>
              <TableCell className="font-medium">{price.id.slice(0, 8)}</TableCell>
              <TableCell>{formatCurrency(price.amount, price.currency, i18n.language)}</TableCell>
              <TableCell>{price.currency}</TableCell>
              <TableCell>{formatDate(price.effectiveFrom)}</TableCell>
              <TableCell>{price.replacedAt ? formatDate(price.replacedAt) : '—'}</TableCell>
              <TableCell>
                {price.isCurrent ? (
                  <Badge variant="default">{t('Subscriptions.Plans.PriceCurrent')}</Badge>
                ) : (
                  <Badge variant="outline">{t('Subscriptions.Plans.PricePast')}</Badge>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
