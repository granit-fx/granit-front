import { useTranslation } from '@granit/react-localization';
import { useRevokeSeat } from '@granit/react-subscriptions';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@granit/react-ui';
import { toEntityId } from '@granit/types';
import { toast } from 'sonner';

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
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('Subscriptions.Seats.RevokeTitle')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('Subscriptions.Seats.RevokeConfirm', {
              user: seat?.userId ?? '',
            })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('Common.Cancel')}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={revokeSeat.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {revokeSeat.isPending ? t('Common.Loading') : t('Subscriptions.Seats.Revoke')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
