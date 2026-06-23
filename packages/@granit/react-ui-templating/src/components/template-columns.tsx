import {
  TemplateLifecycleStatus,
  type TemplateListItem,
  type WorkflowLifecycleStatus,
} from '@granit/templating';

import { TemplateStatusBadge } from './template-status-badge';

import type { useTranslation } from '@granit/react-localization';
import type { ColumnDef } from '@tanstack/react-table';

type TranslateFn = ReturnType<typeof useTranslation>['t'];

const NUMERIC_STATUS: Record<number, WorkflowLifecycleStatus> = {
  [TemplateLifecycleStatus.Draft]: 'Draft',
  [TemplateLifecycleStatus.PendingReview]: 'PendingReview',
  [TemplateLifecycleStatus.Published]: 'Published',
  [TemplateLifecycleStatus.Archived]: 'Archived',
};

export function createTemplateColumns({
  t,
  onEdit,
  formatDate,
}: {
  t: TranslateFn;
  onEdit: (item: TemplateListItem) => void;
  formatDate: (date: string | Date) => string;
}): ColumnDef<TemplateListItem>[] {
  return [
    {
      accessorKey: 'name',
      header: t('Templates.Columns.Name'),
      cell: ({ row }) => (
        <button
          type="button"
          className="font-medium text-primary hover:underline"
          onClick={() => onEdit(row.original)}
        >
          {row.original.name}
        </button>
      ),
    },
    {
      accessorKey: 'category',
      header: t('Templates.Columns.Category'),
      cell: ({ row }) => row.original.category ?? '—',
    },
    {
      accessorKey: 'layoutName',
      header: t('Templates.Columns.Layout'),
      cell: ({ row }) => row.original.layoutName ?? t('Templates.LayoutDefault'),
    },
    {
      accessorKey: 'culture',
      header: t('Templates.Columns.Culture'),
      cell: ({ row }) => row.original.culture ?? t('Templates.CultureNeutral'),
    },
    {
      accessorKey: 'currentStatus',
      header: t('Templates.Columns.Status'),
      cell: ({ row }) => (
        <TemplateStatusBadge status={NUMERIC_STATUS[row.original.currentStatus] ?? 'Draft'} />
      ),
    },
    {
      accessorKey: 'lastModifiedAt',
      header: t('Templates.Columns.LastModifiedAt'),
      cell: ({ row }) => formatDate(row.original.lastModifiedAt),
    },
    {
      accessorKey: 'lastModifiedBy',
      header: t('Templates.Columns.LastModifiedBy'),
    },
  ];
}
