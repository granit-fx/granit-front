import { useTranslation } from '@granit/react-localization';
import { useArchivePlan } from '@granit/react-subscriptions';
import { toast } from '@granit/react-ui';
import { ConfirmActionDialog } from '@granit/react-ui-kit';
import { toEntityId } from '@granit/types';

import type { PlanId } from '@granit/subscriptions';

interface ArchivePlanDialogProps {
  readonly planId: string;
  readonly planName: string;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}

export function ArchivePlanDialog({
  planId,
  planName,
  open,
  onOpenChange,
}: ArchivePlanDialogProps) {
  const { t } = useTranslation();
  const archivePlan = useArchivePlan();

  function handleConfirm() {
    archivePlan.mutate(
      { id: toEntityId<'Plan'>(planId) as PlanId },
      {
        onSuccess: () => {
          toast.success(t('Subscriptions.Plans.ArchiveSuccess'));
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
      title={t('Subscriptions.Plans.ArchiveTitle')}
      description={
        <>
          {t('Subscriptions.Plans.ArchiveConfirm', { planName })}
          <br />
          <span className="mt-2 block text-sm font-medium text-destructive">
            {t('Subscriptions.Plans.ArchiveWarning')}
          </span>
        </>
      }
      confirmLabel={t('Subscriptions.Plans.Archive')}
      busyLabel={t('Common.Loading')}
      isPending={archivePlan.isPending}
      onConfirm={handleConfirm}
    />
  );
}
