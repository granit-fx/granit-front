import { useTranslation } from '@granit/react-localization';
import { useAttachPaymentMethod, useAvailablePaymentMethods } from '@granit/react-payments';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Spinner,
} from '@granit/react-ui';
import { useState } from 'react';
import { toast } from 'sonner';

import type { PaymentAvailableMethodResponse } from '@granit/payments';

interface AttachMethodDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}

export function AttachMethodDialog({ open, onOpenChange }: AttachMethodDialogProps) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<PaymentAvailableMethodResponse | null>(null);
  const availableQuery = useAvailablePaymentMethods();
  const attachMutation = useAttachPaymentMethod();

  const methods = [...(availableQuery.data ?? [])];

  function handleAttach() {
    if (!selected) return;

    attachMutation.mutate(
      {
        providerName: selected.providerName,
        type: selected.methodType,
        token: '',
      },
      {
        onSuccess: () => {
          // API errors are surfaced by the global MutationCache.onError toast.
          toast.success(t('Payments.Methods.AttachSuccess'));
          setSelected(null);
          onOpenChange(false);
        },
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-slot="attach-method-dialog">
        <DialogHeader>
          <DialogTitle>{t('Payments.Methods.AttachTitle')}</DialogTitle>
          <DialogDescription>{t('Payments.Methods.AttachDescription')}</DialogDescription>
        </DialogHeader>

        {availableQuery.isLoading ? (
          <div className="flex h-32 items-center justify-center">
            <Spinner />
          </div>
        ) : (
          <div className="space-y-2">
            {methods.map((method) => (
              <button
                key={method.methodType}
                type="button"
                onClick={() => setSelected(method)}
                className={`w-full rounded-md border p-3 text-left transition-colors ${
                  selected?.methodType === method.methodType
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <p className="text-sm font-medium text-foreground">{method.displayLabel}</p>
                <p className="text-xs text-muted-foreground">{method.providerName}</p>
              </button>
            ))}

            {methods.length === 0 && (
              <p className="py-4 text-center text-sm text-muted-foreground">
                {t('Payments.Methods.NoAvailable')}
              </p>
            )}
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={attachMutation.isPending}
          >
            {t('Common.Cancel')}
          </Button>
          <Button onClick={handleAttach} disabled={!selected || attachMutation.isPending}>
            {attachMutation.isPending ? t('Common.Loading') : t('Payments.Methods.Attach')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
