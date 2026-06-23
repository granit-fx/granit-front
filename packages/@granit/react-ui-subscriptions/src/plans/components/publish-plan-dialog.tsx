import { useTranslation } from '@granit/react-localization';
import { usePublishPlan } from '@granit/react-subscriptions';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  toast,
} from '@granit/react-ui';
import { toEntityId } from '@granit/types';

import type { PlanId } from '@granit/subscriptions';

interface PublishPlanDialogProps {
  readonly planId: string;
  readonly planName: string;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}

export function PublishPlanDialog({
  planId,
  planName,
  open,
  onOpenChange,
}: PublishPlanDialogProps) {
  const { t } = useTranslation();
  const publishPlan = usePublishPlan();

  function handleConfirm() {
    publishPlan.mutate(
      { id: toEntityId<'Plan'>(planId) as PlanId },
      {
        onSuccess: () => {
          toast.success(t('Subscriptions.Plans.PublishSuccess'));
          onOpenChange(false);
        },
      }
    );
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('Subscriptions.Plans.PublishTitle')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('Subscriptions.Plans.PublishConfirm', { planName })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('Common.Cancel')}</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={publishPlan.isPending}>
            {publishPlan.isPending ? t('Common.Loading') : t('Subscriptions.Plans.Publish')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
