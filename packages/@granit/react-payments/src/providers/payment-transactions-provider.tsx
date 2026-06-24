// ---------------------------------------------------------------------------
// Payment transactions provider — wires the @granit/query-engine endpoint for
// the `MapGranitQuery<PaymentTransactionResponse>()` group exposed under
// `{basePath}/transactions` by Granit.Payments.Endpoints.
//
// Payments is a multi-resource module (transactions / refunds / disputes /
// methods each ship a `/meta`), so the `QueryProvider` is scoped per resource
// here rather than on the top-level PaymentsProvider — wrap the transaction
// grid in this provider, not the whole app.
// ---------------------------------------------------------------------------

import { QueryProvider } from '@granit/react-query-engine';
import { useMemo } from 'react';

import { usePaymentsConfig } from './payments-provider';

import type { QueryConfig } from '@granit/query-engine';
import type { ReactNode } from 'react';

export interface PaymentTransactionsProviderProps {
  readonly children: ReactNode;
}

/**
 * Provides the payment-transactions query surface to
 * {@link usePaymentTransactionsQuery}. Reads the resolved payments config
 * (client + basePath) from the nearest {@link PaymentsProvider} and scopes the
 * inner `QueryProvider` to `{basePath}/transactions`.
 *
 * ```tsx
 * <PaymentsProvider config={{ client }}>
 *   <PaymentTransactionsProvider>
 *     <TransactionGrid />
 *   </PaymentTransactionsProvider>
 * </PaymentsProvider>
 * ```
 */
export function PaymentTransactionsProvider({
  children,
}: Readonly<PaymentTransactionsProviderProps>) {
  const config = usePaymentsConfig();
  const queryConfig = useMemo<QueryConfig>(
    () => ({ client: config.client, basePath: `${config.basePath!}/transactions` }),
    [config]
  );

  return <QueryProvider config={queryConfig}>{children}</QueryProvider>;
}
