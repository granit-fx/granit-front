import { useTranslation } from '@granit/react-localization';
import { useAssignSeat } from '@granit/react-subscriptions';
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

import type { SubscriptionId } from '@granit/subscriptions';
import type { UserId } from '@granit/types';

interface AssignSeatDialogProps {
  readonly subscriptionId: string;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}

export function AssignSeatDialog({ subscriptionId, open, onOpenChange }: AssignSeatDialogProps) {
  const { t } = useTranslation();
  const assignSeat = useAssignSeat(toEntityId<'Subscription'>(subscriptionId) as SubscriptionId);
  const [userId, setUserId] = useState('');

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    assignSeat.mutate(
      { userId: toEntityId<'User'>(userId) as UserId },
      {
        onSuccess: () => {
          toast.success(t('Subscriptions.Seats.AssignSuccess'));
          onOpenChange(false);
          setUserId('');
        },
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('Subscriptions.Seats.Assign')}</DialogTitle>
          <DialogDescription>{t('Subscriptions.Seats.AssignDescription')}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="seat-user-id">{t('Subscriptions.Seats.Form.UserId')}</Label>
            <Input
              id="seat-user-id"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={assignSeat.isPending}
            >
              {t('Common.Cancel')}
            </Button>
            <Button type="submit" disabled={assignSeat.isPending}>
              {assignSeat.isPending ? t('Common.Loading') : t('Subscriptions.Seats.Assign')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
