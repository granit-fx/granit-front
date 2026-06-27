import { useTranslation } from '@granit/react-localization';
import { useRevokeSeat } from '@granit/react-subscriptions';
import { toast } from '@granit/react-ui';
import { ConfirmActionDialog } from '@granit/react-ui-kit';
import { toEntityId } from '@granit/types';

import type { SeatResponse, SubscriptionId } from '@granit/subscriptions';

interface RevokeSeatDialogProps {
  readonly subscriptionId: string;
  readonly seat: SeatResponse | null;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}

export function RevokeSeatDialog({
  subscriptionId,
  seat,
  open,
  onOpenChange,
}: RevokeSeatDialogProps) {
  const { t } = useTranslation();
  const revokeSeat = useRevokeSeat(toEntityId<'Subscription'>(subscriptionId) as SubscriptionId);

  function handleConfirm() {
    if (!seat) return;
    revokeSeat.mutate(
      { userId: seat.userId },
      {
        onSuccess: () => {
          toast.success(t('Subscriptions.Seats.RevokeSuccess'));
          onOpenChange(false);
        },
      }
    );
  }

  return (
    <ConfirmActionDialog
      open={open}
      onOpenChange={onOpenChange}
      tone="destructive"
      title={t('Subscriptions.Seats.RevokeTitle')}
      description={t('Subscriptions.Seats.RevokeConfirm', {
        user: seat?.userId ?? '',
      })}
      confirmLabel={t('Subscriptions.Seats.Revoke')}
      busyLabel={t('Common.Loading')}
      isPending={revokeSeat.isPending}
      onConfirm={handleConfirm}
    />
  );
}
