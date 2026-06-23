import { useTranslation } from '@granit/react-localization';
import { useArchivePlan } from '@granit/react-subscriptions';
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
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('Subscriptions.Plans.ArchiveTitle')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('Subscriptions.Plans.ArchiveConfirm', { planName })}
            <br />
            <span className="mt-2 block text-sm font-medium text-destructive">
              {t('Subscriptions.Plans.ArchiveWarning')}
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('Common.Cancel')}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={archivePlan.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {archivePlan.isPending ? t('Common.Loading') : t('Subscriptions.Plans.Archive')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
