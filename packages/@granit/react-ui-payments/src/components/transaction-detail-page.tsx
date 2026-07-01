import { useDateFormatter, useTranslation } from '@granit/react-localization';
import { usePaymentTransaction } from '@granit/react-payments';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Separator,
  Spinner,
} from '@granit/react-ui';
import { EmptyState, ManualDataTable } from '@granit/react-ui-kit';
import { toEntityId } from '@granit/types';
import { formatCurrency } from '@granit/utils';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { createDisputeColumns } from './dispute-columns';
import { createRefundColumns } from './refund-columns';
import { RefundDialog } from './refund-dialog';
import { TransactionStatusBadge } from './transaction-status-badge';

import type { PaymentDisputeResponse, PaymentRefundResponse } from '@granit/payments';

// Refunds and disputes are small nested arrays on the transaction — a single
// page with the pagination bar hidden. Any page size larger than the expected
// count keeps everything on one page.
const NESTED_PAGE_SIZE = 100;

export function TransactionDetailPage() {
  const { t, i18n } = useTranslation();
  const { formatDateTime } = useDateFormatter();
  const { id } = useParams<{ id: string }>();
  const [refundOpen, setRefundOpen] = useState(false);

  const transactionId = toEntityId<'PaymentTransaction'>(id!);
  const transactionQuery = usePaymentTransaction(transactionId);

  const refundColumns = useMemo(
    () => createRefundColumns({ t, formatDateTime }),
    [t, formatDateTime]
  );
  const disputeColumns = useMemo(
    () => createDisputeColumns({ t, formatDateTime }),
    [t, formatDateTime]
  );

  const transaction = transactionQuery.data;
  const refunds: PaymentRefundResponse[] = [...(transaction?.refunds ?? [])];
  const disputes: PaymentDisputeResponse[] = [...(transaction?.disputes ?? [])];

  if (transactionQuery.isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!transaction) {
    return <EmptyState message={t('Payments.Transactions.NotFound')} />;
  }

  return (
    <div data-slot="transaction-detail-page" className="space-y-6">
      {/* Back link and actions */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/payments/transactions">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('Common.Back')}
          </Link>
        </Button>
        {transaction.status === 'Succeeded' && (
          <Button variant="outline" size="sm" onClick={() => setRefundOpen(true)}>
            <RotateCcw className="mr-2 h-4 w-4" />
            {t('Payments.Refund.Title')}
          </Button>
        )}
      </div>

      {/* Transaction info */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{t('Payments.Transactions.Detail')}</CardTitle>
            <TransactionStatusBadge status={transaction.status} />
          </div>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                {t('Payments.Transactions.Columns.Id')}
              </dt>
              <dd className="mt-1 font-mono text-sm">{transaction.id}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                {t('Payments.Transactions.Columns.Amount')}
              </dt>
              <dd className="mt-1 text-sm font-semibold">
                {formatCurrency(transaction.amount, transaction.currency, i18n.language)}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                {t('Payments.Transactions.Columns.Currency')}
              </dt>
              <dd className="mt-1 text-sm">{transaction.currency}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                {t('Payments.Transactions.Columns.PaymentMethod')}
              </dt>
              <dd className="mt-1 text-sm">{transaction.paymentMethodId}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                {t('Payments.Transactions.Columns.Provider')}
              </dt>
              <dd className="mt-1 text-sm">{transaction.providerName}</dd>
            </div>
            {transaction.succeededAt && (
              <div>
                <dt className="text-sm font-medium text-muted-foreground">
                  {t('Payments.Transactions.SucceededAt')}
                </dt>
                <dd className="mt-1 text-sm">{formatDateTime(transaction.succeededAt)}</dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>

      <Separator />

      {/* Refunds section */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-foreground">{t('Payments.Refunds.Title')}</h3>
        <ManualDataTable
          data-slot="refunds-table"
          columns={refundColumns}
          data={refunds}
          totalCount={refunds.length}
          page={1}
          pageSize={NESTED_PAGE_SIZE}
          pageSizes={[NESTED_PAGE_SIZE]}
          onPageChange={() => undefined}
          onPageSizeChange={() => undefined}
          hidePaginationOnSinglePage
          emptyMessage={t('Payments.Refunds.NoRefunds')}
        />
      </div>

      {/* Disputes section */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-foreground">{t('Payments.Disputes.Title')}</h3>
        <ManualDataTable
          data-slot="disputes-table"
          columns={disputeColumns}
          data={disputes}
          totalCount={disputes.length}
          page={1}
          pageSize={NESTED_PAGE_SIZE}
          pageSizes={[NESTED_PAGE_SIZE]}
          onPageChange={() => undefined}
          onPageSizeChange={() => undefined}
          hidePaginationOnSinglePage
          emptyMessage={t('Payments.Disputes.NoDisputes')}
        />
      </div>

      {/* Refund dialog */}
      <RefundDialog
        open={refundOpen}
        onOpenChange={setRefundOpen}
        transactionId={transaction.id}
        maxAmount={transaction.amount}
        currency={transaction.currency}
      />
    </div>
  );
}
