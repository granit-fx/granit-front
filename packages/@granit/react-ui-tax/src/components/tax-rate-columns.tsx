import { Button } from '@granit/react-ui';
import { Eye } from 'lucide-react';

import type { useTranslation } from '@granit/react-localization';
import type { TaxRateEntry } from '@granit/tax';
import type { ColumnDef } from '@tanstack/react-table';

// Type `t` off useTranslation's return rather than importing `TFunction` from
// i18next directly — keeps the column factory immune to i18next version skew.
type TranslateFn = ReturnType<typeof useTranslation>['t'];

interface TaxRateColumnOptions {
  readonly t: TranslateFn;
  readonly onViewDetail: (countryCode: string) => void;
}

export function createTaxRateColumns({
  t,
  onViewDetail,
}: TaxRateColumnOptions): ColumnDef<TaxRateEntry, unknown>[] {
  return [
    {
      id: 'countryCode',
      accessorKey: 'countryCode',
      header: t('Tax.Rates.Columns.CountryCode'),
      enableSorting: true,
      cell: ({ row }) => (
        <span className="font-mono text-sm font-medium text-foreground">
          {row.original.countryCode}
        </span>
      ),
    },
    {
      id: 'standardRate',
      accessorKey: 'standardRate',
      header: t('Tax.Rates.Columns.StandardRate'),
      enableSorting: true,
      cell: ({ row }) => (
        <span className="text-sm font-medium text-foreground">{row.original.standardRate}%</span>
      ),
    },
    {
      id: 'reducedRate',
      accessorKey: 'reducedRate',
      header: t('Tax.Rates.Columns.ReducedRate'),
      enableSorting: false,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.reducedRate == null ? '—' : `${row.original.reducedRate}%`}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      enableSorting: false,
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onViewDetail(row.original.countryCode)}
          aria-label={`${t('Tax.Rates.Actions.ViewDetails')} ${row.original.countryCode}`}
        >
          <Eye className="mr-2 h-4 w-4" />
          {t('Tax.Rates.Actions.ViewDetails')}
        </Button>
      ),
    },
  ];
}
