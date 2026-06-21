import { Button } from '@granit/react-ui';
import { Eye } from 'lucide-react';
import { Link } from 'react-router-dom';

import { AuditCategoryBadge } from './audit-category-badge';

import type { AuditEntryResponse } from '@granit/auditing';
import type { useTranslation } from '@granit/react-localization';
import type { ColumnDef } from '@tanstack/react-table';

/** The `t` produced by react-localization's `useTranslation` — derived from the
 * hook itself so the column factory's type always matches the caller's, free of
 * any i18next version skew across the workspace. */
type TranslateFn = ReturnType<typeof useTranslation>['t'];

interface AuditColumnOptions {
  readonly t: TranslateFn;
  readonly formatDateTime: (date: string | Date) => string;
  /** Route base for the detail link. The app owns its route prefix. */
  readonly routeBase?: string;
}

export function createAuditColumns({
  t,
  formatDateTime,
  routeBase = '/auditing',
}: AuditColumnOptions): ColumnDef<AuditEntryResponse, unknown>[] {
  return [
    {
      id: 'timestamp',
      accessorKey: 'timestamp',
      header: t('Audit.Columns.Timestamp'),
      cell: ({ row }) => (
        <span className="whitespace-nowrap font-mono text-xs text-muted-foreground">
          {formatDateTime(row.original.timestamp)}
        </span>
      ),
    },
    {
      id: 'userName',
      accessorKey: 'userName',
      header: t('Audit.Columns.UserName'),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.userName ?? (
            <span className="italic text-muted-foreground/70">{t('Audit.System')}</span>
          )}
        </span>
      ),
    },
    {
      id: 'category',
      accessorKey: 'category',
      header: t('Audit.Columns.Category'),
      cell: ({ row }) => <AuditCategoryBadge category={row.original.category} />,
    },
    {
      id: 'entityChangeCount',
      accessorKey: 'entityChangeCount',
      header: t('Audit.Columns.Changes'),
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">
          {row.original.entityChangeCount}
        </span>
      ),
    },
    {
      id: 'ipAddress',
      accessorKey: 'ipAddress',
      header: t('Audit.Columns.IpAddress'),
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">
          {row.original.ipAddress ?? '-'}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <Button variant="ghost" size="icon" asChild>
          <Link to={`${routeBase}/${row.original.id}`}>
            <Eye className="h-4 w-4" />
            <span className="sr-only">{t('Audit.ViewDetail')}</span>
          </Link>
        </Button>
      ),
    },
  ];
}
