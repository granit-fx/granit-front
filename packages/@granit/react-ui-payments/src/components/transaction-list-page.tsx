import { useTranslation } from '@granit/react-localization';
import { PaymentTransactionsProvider, usePaymentTransactionsQuery } from '@granit/react-payments';
import { Button } from '@granit/react-ui';
import { QueryEndpointDataTable } from '@granit/react-ui-admin-kit';
import { Plus } from 'lucide-react';
import { useMemo, useState } from 'react';

import { ChargeDialog } from './charge-dialog';
import { createTransactionColumns } from './transaction-columns';

// Query-engine surface: `GET {basePath}/transactions` is a
// `MapGranitQuery<PaymentTransactionResponse>` endpoint (it ships a `/meta`), so
// the list is driven by `usePaymentTransactionsQuery` (useQueryEndpoint) scoped
// to the transactions resource by `PaymentTransactionsProvider`. Server-side
// pagination / sort / group-by live in the shared reducer; the admin-kit grid
// renders the paged result and dispatches changes back through it.
function TransactionListContent() {
  const { t } = useTranslation();
  const [chargeOpen, setChargeOpen] = useState(false);

  const queryEndpoint = usePaymentTransactionsQuery();
  const columns = useMemo(() => createTransactionColumns({ t }), [t]);

  return (
    <div data-slot="transaction-list-page" className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">
            {t('Payments.Transactions.Title')}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('Payments.Transactions.Subtitle')}
          </p>
        </div>
        <Button size="sm" onClick={() => setChargeOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {t('Payments.Charge.Title')}
        </Button>
      </div>

      <QueryEndpointDataTable queryEndpoint={queryEndpoint} columns={columns} />

      <ChargeDialog open={chargeOpen} onOpenChange={setChargeOpen} />
    </div>
  );
}

export function TransactionListPage() {
  return (
    <PaymentTransactionsProvider>
      <TransactionListContent />
    </PaymentTransactionsProvider>
  );
}
