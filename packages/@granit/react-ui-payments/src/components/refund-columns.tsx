import { createPaymentHistoryColumns } from './payment-history-columns';

import type { PaymentRefundResponse, RefundStatus } from '@granit/payments';
import type { DataTableColumnDef } from '@granit/react-ui-kit';
import type { TFunction } from 'i18next';

const refundStatusVariant: Record<RefundStatus, 'default' | 'secondary' | 'destructive'> = {
  Succeeded: 'default',
  Pending: 'secondary',
  Failed: 'destructive',
};

interface RefundColumnOptions {
  readonly t: TFunction;
  readonly formatDateTime: (date: string | Date) => string;
}

export function createRefundColumns(
  options: RefundColumnOptions
): DataTableColumnDef<PaymentRefundResponse, unknown>[] {
  return createPaymentHistoryColumns<PaymentRefundResponse, RefundStatus>({
    ...options,
    i18nPrefix: 'Payments.Refunds',
    statusVariant: refundStatusVariant,
  });
}
