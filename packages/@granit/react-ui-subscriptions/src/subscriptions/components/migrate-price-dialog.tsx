import { useTranslation } from '@granit/react-localization';
import { useMigrateSubscriptionPrice, usePlan } from '@granit/react-subscriptions';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@granit/react-ui';
import { toEntityId } from '@granit/types';
import { useState } from 'react';
import { toast } from 'sonner';

import { formatCurrency } from '../../format-currency';

import type { PlanPriceResponse, SubscriptionId } from '@granit/subscriptions';

interface MigratePriceDialogProps {
  readonly subscriptionId: string;
  readonly planId: string;
  readonly currentPlanPriceId: string | null;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}

export function MigratePriceDialog({
  subscriptionId,
  planId,
  currentPlanPriceId,
  open,
  onOpenChange,
}: MigratePriceDialogProps) {
  const { t, i18n } = useTranslation();
  const { data: plan } = usePlan(planId);
  const migratePrice = useMigrateSubscriptionPrice();
  const [targetPriceId, setTargetPriceId] = useState('');

  const prices = plan?.prices ?? [];
  const currentPrice = prices.find((price) => price.id === currentPlanPriceId);
  const targetOptions = prices.filter((price) => price.id !== currentPlanPriceId);
  const targetPrice = prices.find((price) => price.id === targetPriceId);

  function priceLabel(price: PlanPriceResponse): string {
    const amount = formatCurrency(price.amount, price.currency, i18n.language);
    return `${amount} / ${t(`Subscriptions.BillingInterval.${price.interval}`)}`;
  }

  function handleConfirm() {
    if (!targetPrice) return;
    migratePrice.mutate(
      {
        id: toEntityId<'Subscription'>(subscriptionId) as SubscriptionId,
        request: { newPlanPriceId: targetPrice.id },
      },
      {
        onSuccess: () => {
          toast.success(t('Subscriptions.List.MigratePriceSuccess'));
          setTargetPriceId('');
          onOpenChange(false);
        },
        onError: () => toast.error(t('Subscriptions.List.MigratePriceError')),
      }
    );
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent data-slot="migrate-price-dialog">
        <AlertDialogHeader>
          <AlertDialogTitle>{t('Subscriptions.List.MigratePrice')}</AlertDialogTitle>
          <AlertDialogDescription>
            {currentPrice
              ? `${t('Subscriptions.List.MigratePriceFrom')} ${priceLabel(currentPrice)}`
              : t('Subscriptions.List.MigratePriceDescription')}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2">
          <Label htmlFor="migrate-target-price">{t('Subscriptions.List.MigratePriceTo')}</Label>
          {targetOptions.length > 0 ? (
            <Select value={targetPriceId} onValueChange={setTargetPriceId}>
              <SelectTrigger id="migrate-target-price" data-slot="migrate-target-price">
                <SelectValue placeholder={t('Subscriptions.List.MigratePriceSelectPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {targetOptions.map((price) => (
                  <SelectItem key={price.id} value={price.id}>
                    {priceLabel(price)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <p className="text-sm text-muted-foreground">
              {t('Subscriptions.List.MigratePriceNoOptions')}
            </p>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>{t('Common.Cancel')}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={!targetPrice || migratePrice.isPending}
          >
            {migratePrice.isPending ? t('Common.Loading') : t('Subscriptions.List.MigratePrice')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
