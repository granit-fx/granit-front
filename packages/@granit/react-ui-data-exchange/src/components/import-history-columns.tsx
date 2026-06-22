import { Eye } from 'lucide-react';

import {
  createJobActionColumn,
  createJobDateColumn,
  createJobEntityColumn,
  createJobStatusColumn,
} from './job-history-columns';

import type { ImportJobResponse } from '@granit/data-exchange';
import type { useTranslation } from '@granit/react-localization';
import type { ColumnDef } from '@tanstack/react-table';

type TranslateFn = ReturnType<typeof useTranslation>['t'];

interface ImportColumnOptions {
  readonly t: TranslateFn;
  readonly formatDateTime: (date: string | Date) => string;
  readonly onViewReport: (job: ImportJobResponse) => void;
}

export function createImportHistoryColumns({
  t,
  formatDateTime,
  onViewReport,
}: ImportColumnOptions): ColumnDef<ImportJobResponse, unknown>[] {
  return [
    createJobDateColumn<ImportJobResponse>(t, formatDateTime),
    createJobEntityColumn<ImportJobResponse>(t),
    {
      id: 'originalFileName',
      accessorKey: 'originalFileName',
      header: t('DataExchange.Columns.FileName'),
      cell: ({ row }) => <span className="font-mono text-sm">{row.original.originalFileName}</span>,
    },
    createJobStatusColumn<ImportJobResponse>(t),
    createJobActionColumn<ImportJobResponse>({
      icon: <Eye className="size-4" />,
      ariaLabel: t('DataExchange.ViewReport'),
      onAction: onViewReport,
    }),
  ];
}
