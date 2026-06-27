import { useTranslation } from '@granit/react-localization';
import { useDetachPaymentMethod } from '@granit/react-payments';
import { toast } from '@granit/react-ui';
import { ConfirmActionDialog } from '@granit/react-ui-kit';

import type { PaymentMethodResponse } from '@granit/payments';

interface DetachMethodDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly method: PaymentMethodResponse | null;
}

export function DetachMethodDialog({ open, onOpenChange, method }: DetachMethodDialogProps) {
  const { t } = useTranslation();
  const detachMutation = useDetachPaymentMethod();

  function handleDetach() {
    if (!method) return;

    detachMutation.mutate(method.id, {
      onSuccess: () => {
        // API errors are surfaced by the global MutationCache.onError toast.
        toast.success(t('Payments.Methods.DetachSuccess'));
        onOpenChange(false);
      },
    });
  }

  const label = method?.displayLabel ?? '';

  return (
    <ConfirmActionDialog
      open={open}
      onOpenChange={onOpenChange}
      data-slot="detach-method-dialog"
      tone="destructive"
      title={t('Payments.Methods.DetachTitle')}
      description={t('Payments.Methods.DetachConfirmation', { method: label })}
      confirmLabel={t('Payments.Methods.Detach')}
      busyLabel={t('Common.Loading')}
      isPending={detachMutation.isPending}
      onConfirm={handleDetach}
    />
  );
}
