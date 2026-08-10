import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@granit/react-ui';
import { MoreHorizontal } from 'lucide-react';

import type { TenantQueryItem } from './types';
import type { useTranslation } from '@granit/react-localization';
import type { DataTableColumnDef } from '@granit/react-ui-kit';

type TranslateFn = ReturnType<typeof useTranslation>['t'];

interface TenantColumnOptions {
  readonly t: TranslateFn;
  readonly onEdit: (id: string) => void;
  readonly onToggleStatus: (tenant: TenantQueryItem) => void;
  readonly canUpdate: boolean;
  readonly canManage: boolean;
  readonly formatDate: (date: string | Date) => string;
}

export function createTenantColumns({
  t,
  onEdit,
  onToggleStatus,
  canUpdate,
  canManage,
  formatDate,
}: TenantColumnOptions): DataTableColumnDef<TenantQueryItem, unknown>[] {
  return [
    {
      id: 'name',
      accessorKey: 'name',
      header: t('Tenants.Columns.Name'),
      enableSorting: true,
    },
    {
      id: 'identifier',
      accessorKey: 'identifier',
      header: t('Tenants.Columns.Identifier'),
      enableSorting: true,
      cell: ({ row }) => <span className="font-mono text-sm">{row.original.identifier}</span>,
    },
    {
      id: 'contactEmail',
      accessorKey: 'contactEmail',
      header: t('Tenants.Columns.ContactEmail'),
      cell: ({ row }) => row.original.contactEmail ?? '—',
    },
    {
      id: 'jurisdiction',
      accessorKey: 'jurisdiction',
      header: t('Tenants.Columns.Jurisdiction'),
      cell: ({ row }) =>
        row.original.jurisdiction ? (
          <span className="font-mono text-sm">{row.original.jurisdiction}</span>
        ) : (
          '—'
        ),
    },
    {
      id: 'activated',
      accessorKey: 'activated',
      header: t('Tenants.Columns.Status'),
      cell: ({ row }) => {
        const active = row.original.activated;
        return (
          <Badge variant={active ? 'default' : 'secondary'}>
            {active ? t('Tenants.Status.Active') : t('Tenants.Status.Inactive')}
          </Badge>
        );
      },
    },
    {
      id: 'createdAt',
      accessorKey: 'createdAt',
      header: t('Tenants.Columns.CreatedAt'),
      enableSorting: true,
      cell: ({ row }) => formatDate(row.original.createdAt),
    },
    {
      id: 'actions',
      header: '',
      enableSorting: false,
      cell: ({ row }) => {
        const tenant = row.original;
        if (!canUpdate && !canManage) return null;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="size-4" />
                <span className="sr-only">{t('Common.Actions')}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {canUpdate && (
                <DropdownMenuItem onClick={() => onEdit(tenant.id)}>
                  {t('Tenants.Actions.Edit')}
                </DropdownMenuItem>
              )}
              {canUpdate && canManage && <DropdownMenuSeparator />}
              {canManage && (
                <DropdownMenuItem onClick={() => onToggleStatus(tenant)}>
                  {tenant.activated
                    ? t('Tenants.Actions.Deactivate')
                    : t('Tenants.Actions.Activate')}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
