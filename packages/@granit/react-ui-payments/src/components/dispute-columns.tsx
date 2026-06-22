import { createPaymentHistoryColumns } from './payment-history-columns';

import type { DisputeStatus, PaymentDisputeResponse } from '@granit/payments';
import type { ColumnDef } from '@tanstack/react-table';
import type { TFunction } from 'i18next';

const disputeStatusVariant: Record<
  DisputeStatus,
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  Open: 'secondary',
  Closed: 'outline',
  Won: 'default',
  Lost: 'destructive',
};

interface DisputeColumnOptions {
  readonly t: TFunction;
  readonly formatDateTime: (date: string | Date) => string;
}

export function createDisputeColumns(
  options: DisputeColumnOptions
): ColumnDef<PaymentDisputeResponse, unknown>[] {
  return createPaymentHistoryColumns<PaymentDisputeResponse, DisputeStatus>({
    ...options,
    i18nPrefix: 'Payments.Disputes',
    statusVariant: disputeStatusVariant,
  });
}
