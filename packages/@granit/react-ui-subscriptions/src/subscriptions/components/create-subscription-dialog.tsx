import { useTranslation } from '@granit/react-localization';
import { useActivePlans, useCreateSubscription } from '@granit/react-subscriptions';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  toast,
} from '@granit/react-ui';
import { toEntityId, toISODateString } from '@granit/types';
import { useState, type FormEvent } from 'react';

import type { PlanId } from '@granit/subscriptions';
import type { CurrencyCode } from '@granit/types';

interface CreateSubscriptionDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}

export function CreateSubscriptionDialog({ open, onOpenChange }: CreateSubscriptionDialogProps) {
  const { t } = useTranslation();
  const createSubscription = useCreateSubscription();
  const { data: plans } = useActivePlans();
  const [partyId, setPartyId] = useState('');
  const [planId, setPlanId] = useState('');
  const [currency, setCurrency] = useState('EUR');
  const [trialEndsAt, setTrialEndsAt] = useState('');

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    createSubscription.mutate(
      {
        partyId,
        planId: toEntityId<'Plan'>(planId) as PlanId,
        currency: currency as CurrencyCode,
        trialEndsAt: trialEndsAt ? toISODateString(trialEndsAt) : null,
      },
      {
        onSuccess: () => {
          toast.success(t('Subscriptions.List.CreateSuccess'));
          onOpenChange(false);
          setPartyId('');
          setPlanId('');
          setCurrency('EUR');
          setTrialEndsAt('');
        },
      }
    );
  }

  const publishedPlans = plans?.filter((p) => p.lifecycleStatus === 'Published') ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('Subscriptions.List.Create')}</DialogTitle>
          <DialogDescription>{t('Subscriptions.List.CreateDescription')}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sub-party-id">{t('Subscriptions.List.Form.Party')}</Label>
            <Input
              id="sub-party-id"
              value={partyId}
              onChange={(e) => setPartyId(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sub-plan-id">{t('Subscriptions.List.Form.Plan')}</Label>
            <Select value={planId} onValueChange={setPlanId}>
              <SelectTrigger id="sub-plan-id">
                <SelectValue placeholder={t('Subscriptions.List.Form.SelectPlan')} />
              </SelectTrigger>
              <SelectContent>
                {publishedPlans.map((plan) => (
                  <SelectItem key={plan.id} value={plan.id}>
                    {plan.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sub-currency">{t('Subscriptions.List.Form.Currency')}</Label>
            <Input
              id="sub-currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sub-trial-ends-at">{t('Subscriptions.List.Form.TrialEndsAt')}</Label>
            <Input
              id="sub-trial-ends-at"
              type="datetime-local"
              value={trialEndsAt}
              onChange={(e) => setTrialEndsAt(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createSubscription.isPending}
            >
              {t('Common.Cancel')}
            </Button>
            <Button type="submit" disabled={createSubscription.isPending || !planId || !partyId}>
              {createSubscription.isPending ? t('Common.Loading') : t('Subscriptions.List.Create')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
