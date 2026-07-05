import { useDecommissionDevice } from '@granit/react-iot';
import { useTranslation } from '@granit/react-localization';
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

import type { DeviceResponse } from '@granit/iot';

interface DecommissionDeviceDialogProps {
  device: DeviceResponse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function DecommissionDeviceDialog({
  device,
  open,
  onOpenChange,
  onSuccess,
}: Readonly<DecommissionDeviceDialogProps>) {
  const { t } = useTranslation();
  const decommission = useDecommissionDevice();

  if (!device) return null;

  const handleConfirm = () => {
    // `mutate` (not `mutateAsync`) routes failures to the global
    // MutationCache.onError toast — no local catch needed.
    decommission.mutate(device.id, {
      onSuccess: () => {
        toast.success(t('IoT.DecommissionSuccess'));
        onOpenChange(false);
        onSuccess();
      },
    });
  };

  const name = device.label ?? device.serialNumber;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-slot="decommission-device-dialog">
        <DialogHeader>
          <DialogTitle>{t('IoT.DecommissionDialog.Title')}</DialogTitle>
          <DialogDescription>{t('IoT.DecommissionDialog.Message', { name })}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={decommission.isPending}
          >
            {t('Common.Cancel')}
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={decommission.isPending}>
            {decommission.isPending ? '...' : t('IoT.Actions.Decommission')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
