import { useTranslation } from '@granit/react-localization';
import { useArchiveMeterDefinition } from '@granit/react-metering';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  toast,
} from '@granit/react-ui';

import type { MeterDefinitionResponse } from '@granit/metering';

interface ArchiveMeterDialogProps {
  meter: MeterDefinitionResponse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ArchiveMeterDialog({
  meter,
  open,
  onOpenChange,
  onSuccess,
}: Readonly<ArchiveMeterDialogProps>) {
  const { t } = useTranslation();
  const archive = useArchiveMeterDefinition();

  if (!meter) return null;

  const handleConfirm = () => {
    // `mutate` (not `mutateAsync`) routes failures to the global
    // MutationCache.onError toast — no local catch needed.
    archive.mutate(meter.id, {
      onSuccess: () => {
        toast.success(t('Metering.ArchiveSuccess'));
        onOpenChange(false);
        onSuccess();
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-slot="archive-meter-dialog">
        <DialogHeader>
          <DialogTitle>{t('Metering.ArchiveDialog.Title')}</DialogTitle>
          <DialogDescription>
            {t('Metering.ArchiveDialog.Message', { name: meter.name })}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={archive.isPending}
          >
            {t('Common.Cancel')}
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={archive.isPending}>
            {archive.isPending ? '...' : t('Metering.Actions.Archive')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
