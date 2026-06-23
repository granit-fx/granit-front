import { useTranslation } from '@granit/react-localization';
import { useCancelSubscription } from '@granit/react-subscriptions';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  toast,
} from '@granit/react-ui';
import { toEntityId } from '@granit/types';
import { useState } from 'react';

import type { SubscriptionId } from '@granit/subscriptions';

interface CancelSubscriptionDialogProps {
  readonly subscriptionId: string;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}

export function CancelSubscriptionDialog({
  subscriptionId,
  open,
  onOpenChange,
}: CancelSubscriptionDialogProps) {
  const { t } = useTranslation();
  const cancelSubscription = useCancelSubscription();
  const [cancelMode, setCancelMode] = useState<'immediately' | 'atPeriodEnd'>('atPeriodEnd');
  const [reason, setReason] = useState('');

  function handleConfirm() {
    cancelSubscription.mutate(
      {
        id: toEntityId<'Subscription'>(subscriptionId) as SubscriptionId,
        request: { reason: reason || null, atPeriodEnd: cancelMode === 'atPeriodEnd' },
      },
      {
        onSuccess: () => {
          toast.success(t('Subscriptions.List.CancelSuccess'));
          onOpenChange(false);
        },
      }
    );
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('Subscriptions.List.CancelTitle')}</AlertDialogTitle>
          <AlertDialogDescription>{t('Subscriptions.List.CancelConfirm')}</AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="cancel-reason">{t('Subscriptions.List.CancelReason')}</Label>
            <Input
              id="cancel-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t('Subscriptions.List.CancelReasonPlaceholder')}
            />
          </div>
          <Label htmlFor="cancel-mode">{t('Subscriptions.List.CancelMode')}</Label>
          <Select
            value={cancelMode}
            onValueChange={(v) => setCancelMode(v as 'immediately' | 'atPeriodEnd')}
          >
            <SelectTrigger id="cancel-mode">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="atPeriodEnd">
                {t('Subscriptions.List.CancelAtPeriodEnd')}
              </SelectItem>
              <SelectItem value="immediately">
                {t('Subscriptions.List.CancelImmediately')}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>{t('Common.Cancel')}</AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={cancelSubscription.isPending}
          >
            {cancelSubscription.isPending
              ? t('Common.Loading')
              : t('Subscriptions.List.CancelSubscription')}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
