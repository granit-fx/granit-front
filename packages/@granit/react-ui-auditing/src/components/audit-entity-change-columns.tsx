import { Button } from '@granit/react-ui';
import { Eye } from 'lucide-react';
import { Link } from 'react-router-dom';

import { AuditChangeTypeBadge } from './audit-change-type-badge';

import type { AuditEntityChangeSummaryResponse } from '@granit/auditing';
import type { useTranslation } from '@granit/react-localization';
import type { ColumnDef } from '@tanstack/react-table';

/** The `t` produced by react-localization's `useTranslation` — derived from the
 * hook itself so the column factory's type always matches the caller's, free of
 * any i18next version skew across the workspace. */
type TranslateFn = ReturnType<typeof useTranslation>['t'];

interface AuditEntityChangeColumnOptions {
  readonly t: TranslateFn;
  /** Route base for the parent-entry detail link. The app owns its route prefix. */
  readonly routeBase?: string;
}

export function createAuditEntityChangeColumns({
  t,
  routeBase = '/auditing',
}: AuditEntityChangeColumnOptions): ColumnDef<AuditEntityChangeSummaryResponse, unknown>[] {
  return [
    {
      id: 'entityType',
      accessorKey: 'entityType',
      header: t('Audit.Columns.EntityType'),
      cell: ({ row }) => <span className="font-mono text-sm">{row.original.entityType}</span>,
    },
    {
      id: 'entityId',
      accessorKey: 'entityId',
      header: t('Audit.Columns.EntityId'),
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">{row.original.entityId}</span>
      ),
    },
    {
      id: 'changeType',
      accessorKey: 'changeType',
      header: t('Audit.Columns.ChangeType'),
      cell: ({ row }) => <AuditChangeTypeBadge changeType={row.original.changeType} />,
    },
    {
      id: 'propertyChangeCount',
      accessorKey: 'propertyChangeCount',
      header: t('Audit.Columns.PropertyChanges'),
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">
          {row.original.propertyChangeCount}
        </span>
      ),
    },
    {
      id: 'auditEntryId',
      accessorKey: 'auditEntryId',
      header: t('Audit.Columns.AuditEntryId'),
      cell: ({ row }) => (
        <Button variant="ghost" size="icon" asChild>
          <Link to={`${routeBase}/${row.original.auditEntryId}`}>
            <Eye className="h-4 w-4" />
            <span className="sr-only">{t('Audit.ViewDetail')}</span>
          </Link>
        </Button>
      ),
    },
  ];
}
