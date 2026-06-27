import { useTranslation } from '@granit/react-localization';
import { usePublishPlan } from '@granit/react-subscriptions';
import { toast } from '@granit/react-ui';
import { ConfirmActionDialog } from '@granit/react-ui-kit';
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
    <ConfirmActionDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('Subscriptions.Plans.PublishTitle')}
      description={t('Subscriptions.Plans.PublishConfirm', { planName })}
      confirmLabel={t('Subscriptions.Plans.Publish')}
      busyLabel={t('Common.Loading')}
      isPending={publishPlan.isPending}
      onConfirm={handleConfirm}
    />
  );
}
