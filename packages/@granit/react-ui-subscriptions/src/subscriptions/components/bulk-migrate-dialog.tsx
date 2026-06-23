import { useTranslation } from '@granit/react-localization';
import { useBulkMigrateSubscriptionPrice } from '@granit/react-subscriptions';
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

import type { PlanId, PlanPriceId } from '@granit/subscriptions';

interface BulkMigrateDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}

export function BulkMigrateDialog({ open, onOpenChange }: BulkMigrateDialogProps) {
  const { t } = useTranslation();
  const bulkMigrate = useBulkMigrateSubscriptionPrice();
  const [planId, setPlanId] = useState('');
  const [oldPlanPriceId, setOldPlanPriceId] = useState('');
  const [newPlanPriceId, setNewPlanPriceId] = useState('');

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    bulkMigrate.mutate(
      {
        planId: toEntityId<'Plan'>(planId) as PlanId,
        newPlanPriceId: toEntityId<'PlanPrice'>(newPlanPriceId) as PlanPriceId,
        oldPlanPriceId: oldPlanPriceId
          ? (toEntityId<'PlanPrice'>(oldPlanPriceId) as PlanPriceId)
          : null,
      },
      {
        onSuccess: (data) => {
          toast.success(t('Subscriptions.List.BulkMigrateSuccess', { count: data.migratedCount }));
          onOpenChange(false);
          setPlanId('');
          setOldPlanPriceId('');
          setNewPlanPriceId('');
        },
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('Subscriptions.List.BulkMigrate')}</DialogTitle>
          <DialogDescription>{t('Subscriptions.List.BulkMigrateDescription')}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bulk-plan-id">{t('Subscriptions.List.Form.PlanId')}</Label>
            <Input
              id="bulk-plan-id"
              value={planId}
              onChange={(e) => setPlanId(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bulk-old-price-id">
                {t('Subscriptions.List.Form.OldPlanPriceId')}
              </Label>
              <Input
                id="bulk-old-price-id"
                value={oldPlanPriceId}
                onChange={(e) => setOldPlanPriceId(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bulk-new-price-id">
                {t('Subscriptions.List.Form.NewPlanPriceId')}
              </Label>
              <Input
                id="bulk-new-price-id"
                value={newPlanPriceId}
                onChange={(e) => setNewPlanPriceId(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={bulkMigrate.isPending}
            >
              {t('Common.Cancel')}
            </Button>
            <Button type="submit" disabled={bulkMigrate.isPending}>
              {bulkMigrate.isPending ? t('Common.Loading') : t('Subscriptions.List.BulkMigrate')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
