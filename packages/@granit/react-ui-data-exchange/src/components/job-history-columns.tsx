import { Button } from '@granit/react-ui';

import { JobStatusBadge } from './job-status-badge';

import type { ExportJobStatus, ImportJobStatus } from '@granit/data-exchange';
import type { useTranslation } from '@granit/react-localization';
import type { DataTableColumnDef } from '@granit/react-ui-kit';
import type { ReactNode } from 'react';

// Derive the translate function type from the localization hook rather than
// importing `TFunction` from i18next directly — keeps the column factories immune
// to i18next major-version skew between linked workspace packages.
type TranslateFn = ReturnType<typeof useTranslation>['t'];

type JobStatus = ImportJobStatus | ExportJobStatus;

/** Fields the shared columns read; both import and export job rows satisfy it. */
interface JobHistoryRow {
  readonly createdAt: string | Date;
  readonly definitionName: string;
  readonly status: JobStatus;
}

/** Created-at column, first in both history tables. */
export function createJobDateColumn<TRow extends JobHistoryRow>(
  t: TranslateFn,
  formatDateTime: (date: string | Date) => string
): DataTableColumnDef<TRow, unknown> {
  return {
    id: 'createdAt',
    accessorKey: 'createdAt',
    header: t('DataExchange.Columns.Date'),
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {formatDateTime(row.original.createdAt)}
      </span>
    ),
  };
}

/** Definition-name ("entity") column. */
export function createJobEntityColumn<TRow extends JobHistoryRow>(
  t: TranslateFn
): DataTableColumnDef<TRow, unknown> {
  return {
    id: 'definitionName',
    accessorKey: 'definitionName',
    header: t('DataExchange.Columns.Entity'),
    cell: ({ row }) => (
      <span className="font-medium text-foreground">{row.original.definitionName}</span>
    ),
  };
}

/** Status-badge column. */
export function createJobStatusColumn<TRow extends JobHistoryRow>(
  t: TranslateFn
): DataTableColumnDef<TRow, unknown> {
  return {
    id: 'status',
    accessorKey: 'status',
    header: t('DataExchange.Columns.Status'),
    cell: ({ row }) => <JobStatusBadge status={row.original.status} />,
  };
}

interface JobActionColumnConfig<TRow> {
  readonly icon: ReactNode;
  readonly ariaLabel: string;
  readonly onAction: (job: TRow) => void;
  /** Render the action only for rows passing this predicate (always, if omitted). */
  readonly visible?: (job: TRow) => boolean;
}

/** Trailing icon-button action column (view report / download). */
export function createJobActionColumn<TRow extends JobHistoryRow>({
  icon,
  ariaLabel,
  onAction,
  visible,
}: JobActionColumnConfig<TRow>): DataTableColumnDef<TRow, unknown> {
  return {
    id: 'actions',
    header: '',
    cell: ({ row }) => {
      const job = row.original;
      if (visible?.(job) === false) return null;
      return (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          aria-label={ariaLabel}
          onClick={() => onAction(job)}
        >
          {icon}
        </Button>
      );
    },
  };
}
