import { useTranslation } from '@granit/react-localization';
import { useDetachPaymentMethod } from '@granit/react-payments';
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
import { toast } from 'sonner';

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
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent data-slot="detach-method-dialog">
        <AlertDialogHeader>
          <AlertDialogTitle>{t('Payments.Methods.DetachTitle')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('Payments.Methods.DetachConfirmation', { method: label })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={detachMutation.isPending}>
            {t('Common.Cancel')}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDetach}
            disabled={detachMutation.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {detachMutation.isPending ? t('Common.Loading') : t('Payments.Methods.Detach')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
