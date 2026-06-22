import { LifecycleStatusBadge } from './lifecycle-status-badge';

import type { ProductResponse } from '@granit/catalog';
import type { ColumnDef } from '@tanstack/react-table';
import type { TFunction } from 'i18next';

/**
 * Columns for the products admin grid (full lifecycle). Clicking a row's SKU
 * opens the product detail page.
 */
export function createProductColumns({
  t,
  onOpen,
}: {
  t: TFunction;
  onOpen: (product: ProductResponse) => void;
}): ColumnDef<ProductResponse>[] {
  return [
    {
      accessorKey: 'sku',
      header: t('Catalog.Columns.Sku'),
      cell: ({ row }) => (
        <button
          type="button"
          className="font-mono text-sm text-primary hover:underline"
          onClick={() => onOpen(row.original)}
        >
          {row.original.sku}
        </button>
      ),
    },
    {
      accessorKey: 'name',
      header: t('Catalog.Columns.Name'),
      cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
    },
    {
      accessorKey: 'type',
      header: t('Catalog.Columns.Type'),
    },
    {
      accessorKey: 'unit',
      header: t('Catalog.Columns.Unit'),
    },
    {
      accessorKey: 'lifecycleStatus',
      header: t('Catalog.Columns.Status'),
      cell: ({ row }) => <LifecycleStatusBadge status={row.original.lifecycleStatus} />,
    },
    {
      id: 'mappings',
      header: t('Catalog.Columns.Mappings'),
      cell: ({ row }) =>
        row.original.externalMappings.length > 0
          ? row.original.externalMappings.map((m) => m.providerName).join(', ')
          : '—',
    },
  ];
}
