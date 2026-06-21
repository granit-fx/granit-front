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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@granit/react-ui';
import { getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { Minus, Plus } from 'lucide-react';
import { useMemo, useState } from 'react';

import { AddCreditDialog } from './components/add-credit-dialog';
import { ApplyDebitDialog } from './components/apply-debit-dialog';
import { BalanceSummaryCard } from './components/balance-summary-card';
import { createTransactionColumns } from './components/transaction-columns';

const SUPPORTED_CURRENCIES = ['EUR', 'USD', 'GBP', 'CHF'] as const;
const DEFAULT_PAGE_SIZE = 25;

export function CustomerBalancePage() {
  const { t, i18n } = useTranslation();
  const { formatDateTime } = useDateFormatter();
  const [creditOpen, setCreditOpen] = useState(false);
  const [debitOpen, setDebitOpen] = useState(false);
  const [currency, setCurrency] = useState('EUR');
  const [page, setPage] = useState(1);

  const balanceQuery = useCustomerBalance(currency);
  const transactionsQuery = useBalanceTransactions({
    currency,
    page,
    pageSize: DEFAULT_PAGE_SIZE,
  });

  const columns = useMemo(
    () => createTransactionColumns({ t, formatDateTime, locale: i18n.language }),
    [t, formatDateTime, i18n.language]
  );

  const transactions = transactionsQuery.data?.items ?? [];
  const hasNextPage = transactionsQuery.data?.hasMore ?? false;

  const table = useReactTable({
    data: [...transactions],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

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
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : (header.column.columnDef.header as string)}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {typeof cell.column.columnDef.cell === 'function'
                        ? cell.column.columnDef.cell(cell.getContext())
                        : cell.getValue()}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="py-8 text-center text-muted-foreground"
                >
                  {t('Common.NoResults')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {(page > 1 || hasNextPage) && (
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            {t('Common.Previous')}
          </Button>
          <span className="text-sm text-muted-foreground">
            {t('Common.Page')} {page}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={!hasNextPage}
            onClick={() => setPage((p) => p + 1)}
          >
            {t('Common.Next')}
          </Button>
        </div>
      )}

      {/* Credit dialog */}
      <AddCreditDialog open={creditOpen} onOpenChange={setCreditOpen} defaultCurrency={currency} />

      {/* Debit dialog */}
      <ApplyDebitDialog open={debitOpen} onOpenChange={setDebitOpen} defaultCurrency={currency} />
    </div>
  );
}
