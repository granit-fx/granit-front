import { useTranslation } from '@granit/react-localization';
import { usePaymentMethods } from '@granit/react-payments';
import { Button, Spinner } from '@granit/react-ui';
import { Plus } from 'lucide-react';
import { useState } from 'react';

import { AttachMethodDialog } from './attach-method-dialog';
import { DetachMethodDialog } from './detach-method-dialog';
import { PaymentMethodCard } from './payment-method-card';

import type { PaymentMethodResponse } from '@granit/payments';

export function TenantPaymentMethodsPage() {
  const { t } = useTranslation();
  const [attachOpen, setAttachOpen] = useState(false);
  const [methodToDetach, setMethodToDetach] = useState<PaymentMethodResponse | null>(null);

  const methodsQuery = usePaymentMethods();
  const methods = [...(methodsQuery.data ?? [])];

  return (
    <div data-slot="tenant-payment-methods-page" className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">
            {t('Payments.Methods.MyTitle')}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{t('Payments.Methods.MySubtitle')}</p>
        </div>
        <Button size="sm" onClick={() => setAttachOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {t('Payments.Methods.Add')}
        </Button>
      </div>

      {methodsQuery.isLoading && (
        <div className="flex h-32 items-center justify-center">
          <Spinner />
        </div>
      )}

      {!methodsQuery.isLoading && methods.length === 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">
          {t('Payments.Methods.None')}
        </p>
      )}

      {!methodsQuery.isLoading && methods.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {methods.map((method) => (
            <PaymentMethodCard key={method.id} method={method} onDetach={setMethodToDetach} />
          ))}
        </div>
      )}

      <AttachMethodDialog open={attachOpen} onOpenChange={setAttachOpen} />
      <DetachMethodDialog
        open={methodToDetach !== null}
        onOpenChange={(open) => {
          if (!open) setMethodToDetach(null);
        }}
        method={methodToDetach}
      />
    </div>
  );
}
