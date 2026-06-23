import { useTranslation } from '@granit/react-localization';
import { useActivePlans, useChangeSubscriptionPlan } from '@granit/react-subscriptions';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@granit/react-ui';
import { toEntityId } from '@granit/types';
import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';

import type { PlanId, SubscriptionId } from '@granit/subscriptions';

interface ChangePlanDialogProps {
  readonly subscriptionId: string;
  readonly currentPlanId: string;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}

export function ChangePlanDialog({
  subscriptionId,
  currentPlanId,
  open,
  onOpenChange,
}: ChangePlanDialogProps) {
  const { t } = useTranslation();
  const changePlan = useChangeSubscriptionPlan();
  const { data: plans } = useActivePlans();
  const [newPlanId, setNewPlanId] = useState('');

  const availablePlans =
    plans?.filter((p) => p.lifecycleStatus === 'Published' && p.id !== currentPlanId) ?? [];

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    changePlan.mutate(
      {
        id: toEntityId<'Subscription'>(subscriptionId) as SubscriptionId,
        request: { newPlanId: toEntityId<'Plan'>(newPlanId) as PlanId },
      },
      {
        onSuccess: () => {
          toast.success(t('Subscriptions.List.ChangePlanSuccess'));
          onOpenChange(false);
          setNewPlanId('');
        },
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('Subscriptions.List.ChangePlan')}</DialogTitle>
          <DialogDescription>{t('Subscriptions.List.ChangePlanDescription')}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-plan-id">{t('Subscriptions.List.Form.NewPlan')}</Label>
            <Select value={newPlanId} onValueChange={setNewPlanId}>
              <SelectTrigger id="new-plan-id">
                <SelectValue placeholder={t('Subscriptions.List.Form.SelectPlan')} />
              </SelectTrigger>
              <SelectContent>
                {availablePlans.map((plan) => (
                  <SelectItem key={plan.id} value={plan.id}>
                    {plan.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={changePlan.isPending}
            >
              {t('Common.Cancel')}
            </Button>
            <Button type="submit" disabled={changePlan.isPending || !newPlanId}>
              {changePlan.isPending ? t('Common.Loading') : t('Subscriptions.List.ChangePlan')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
