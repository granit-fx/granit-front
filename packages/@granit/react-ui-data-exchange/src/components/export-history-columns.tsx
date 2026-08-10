import { Download } from 'lucide-react';

import {
  createJobActionColumn,
  createJobDateColumn,
  createJobEntityColumn,
  createJobStatusColumn,
} from './job-history-columns';

import type { ExportJobResponse } from '@granit/data-exchange';
import type { useTranslation } from '@granit/react-localization';
import type { DataTableColumnDef } from '@granit/react-ui-kit';

type TranslateFn = ReturnType<typeof useTranslation>['t'];

interface ExportColumnOptions {
  readonly t: TranslateFn;
  readonly formatDateTime: (date: string | Date) => string;
  readonly onDownload: (job: ExportJobResponse) => void;
}

export function createExportHistoryColumns({
  t,
  formatDateTime,
  onDownload,
}: ExportColumnOptions): DataTableColumnDef<ExportJobResponse, unknown>[] {
  return [
    createJobDateColumn<ExportJobResponse>(t, formatDateTime),
    createJobEntityColumn<ExportJobResponse>(t),
    {
      id: 'format',
      accessorKey: 'format',
      header: t('DataExchange.Columns.Format'),
      cell: ({ row }) => <span className="font-mono text-sm uppercase">{row.original.format}</span>,
    },
    createJobStatusColumn<ExportJobResponse>(t),
    {
      id: 'rowCount',
      accessorKey: 'rowCount',
      header: t('DataExchange.Columns.Rows'),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.rowCount?.toLocaleString() ?? '—'}
        </span>
      ),
    },
    createJobActionColumn<ExportJobResponse>({
      icon: <Download className="size-4" />,
      ariaLabel: t('DataExchange.Download'),
      onAction: onDownload,
      visible: (job) => job.status === 'Completed',
    }),
  ];
}
