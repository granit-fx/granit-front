import { useBalanceTransactions, useCustomerBalance } from '@granit/react-customer-balance';
import { useDateFormatter, useTranslation } from '@granit/react-localization';
import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Spinner,
} from '@granit/react-ui';
import { ManualDataTable } from '@granit/react-ui-kit';
import { Minus, Plus } from 'lucide-react';
import { useMemo, useState } from 'react';

import { AddCreditDialog } from './add-credit-dialog';
import { ApplyDebitDialog } from './apply-debit-dialog';
import { BalanceSummaryCard } from './balance-summary-card';
import { createTransactionColumns } from './transaction-columns';

const SUPPORTED_CURRENCIES = ['EUR', 'USD', 'GBP', 'CHF'] as const;
const DEFAULT_PAGE_SIZE = 25;
const PAGE_SIZES = [10, 25, 50, 100] as const;

export function CustomerBalancePage() {
  const { t, i18n } = useTranslation();
  const { formatDateTime } = useDateFormatter();
  const [creditOpen, setCreditOpen] = useState(false);
  const [debitOpen, setDebitOpen] = useState(false);
  const [currency, setCurrency] = useState('EUR');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);

  const balanceQuery = useCustomerBalance(currency);
  const transactionsQuery = useBalanceTransactions({
    currency,
    page,
    pageSize,
  });

  const columns = useMemo(
    () => createTransactionColumns({ t, formatDateTime, locale: i18n.language }),
    [t, formatDateTime, i18n.language]
  );

  const transactions = transactionsQuery.data?.items ?? [];
  const totalCount = transactionsQuery.data?.totalCount ?? transactions.length;

  if (balanceQuery.isLoading || transactionsQuery.isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div data-slot="customer-balance-page" className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">{t('CustomerBalance.Title')}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t('CustomerBalance.Subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setDebitOpen(true)}>
            <Minus className="mr-2 h-4 w-4" />
            {t('CustomerBalance.ApplyDebit')}
          </Button>
          <Button size="sm" onClick={() => setCreditOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {t('CustomerBalance.AddCredit')}
          </Button>
        </div>
      </div>

      {/* Currency selector */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-foreground">
          {t('CustomerBalance.Currency')}
        </label>
        <Select
          value={currency}
          onValueChange={(v) => {
            setCurrency(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SUPPORTED_CURRENCIES.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Balance summary */}
      {balanceQuery.data && <BalanceSummaryCard balance={balanceQuery.data} />}

      {/* Transactions table */}
      <ManualDataTable
        columns={columns}
        data={transactions}
        totalCount={totalCount}
        page={page}
        pageSize={pageSize}
        pageSizes={PAGE_SIZES}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1);
        }}
      />

      {/* Credit dialog */}
      <AddCreditDialog open={creditOpen} onOpenChange={setCreditOpen} defaultCurrency={currency} />

      {/* Debit dialog */}
      <ApplyDebitDialog open={debitOpen} onOpenChange={setDebitOpen} defaultCurrency={currency} />
    </div>
  );
}
