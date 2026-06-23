import { useTranslation } from '@granit/react-localization';
import { useCreatePriceVersion } from '@granit/react-subscriptions';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  toast,
} from '@granit/react-ui';
import { toEntityId } from '@granit/types';
import { useState, type FormEvent } from 'react';

import type { BillingInterval, PlanId } from '@granit/subscriptions';
import type { CurrencyCode } from '@granit/types';

interface CreatePriceDialogProps {
  readonly planId: string;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}

export function CreatePriceDialog({ planId, open, onOpenChange }: CreatePriceDialogProps) {
  const { t } = useTranslation();
  const createPriceVersion = useCreatePriceVersion();
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('EUR');
  const [interval, setInterval] = useState<BillingInterval>('Monthly');

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    createPriceVersion.mutate(
      {
        planId: toEntityId<'Plan'>(planId) as PlanId,
        request: {
          amount: Number(amount),
          currency: currency as CurrencyCode,
          interval,
        },
      },
      {
        onSuccess: () => {
          toast.success(t('Subscriptions.Plans.PriceCreated'));
          onOpenChange(false);
          setAmount('');
          setCurrency('EUR');
          setInterval('Monthly');
        },
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('Subscriptions.Plans.CreatePriceVersion')}</DialogTitle>
          <DialogDescription>
            {t('Subscriptions.Plans.CreatePriceVersionDescription')}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="price-amount">{t('Subscriptions.Plans.PriceForm.Amount')}</Label>
            <Input
              id="price-amount"
              type="number"
              min="0"
              step="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="price-currency">{t('Subscriptions.Plans.PriceForm.Currency')}</Label>
            <Input
              id="price-currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value.toUpperCase())}
              maxLength={3}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="price-interval">{t('Subscriptions.Plans.PriceForm.Interval')}</Label>
            <Input
              id="price-interval"
              value={interval}
              onChange={(e) => setInterval(e.target.value as BillingInterval)}
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createPriceVersion.isPending}
            >
              {t('Common.Cancel')}
            </Button>
            <Button type="submit" disabled={createPriceVersion.isPending}>
              {createPriceVersion.isPending
                ? t('Common.Loading')
                : t('Subscriptions.Plans.CreatePriceVersion')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
