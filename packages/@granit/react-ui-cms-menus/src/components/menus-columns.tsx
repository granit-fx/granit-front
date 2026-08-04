import { Button } from '@granit/react-ui';
import { Pencil, Trash2 } from 'lucide-react';
import { Link } from 'react-router';

import type { MenuResponse } from '@granit/cms';
import type { useTranslation } from '@granit/react-localization';
import type { ColumnDef } from '@tanstack/react-table';

type TranslateFn = ReturnType<typeof useTranslation>['t'];

interface MenusColumnOptions {
  readonly t: TranslateFn;
  readonly siteId: string;
  readonly onDelete: (menu: MenuResponse) => void;
}

/**
 * Columns for the menus admin grid (`MapGranitQuery<Menu>` → `MenuResponse`).
 * Server-driven sort/filter/pagination is owned by the surrounding
 * `QueryEndpointDataTable`; the actions column links to the edit page and
 * triggers the delete-confirmation dialog (state lives in the page).
 */
export function createMenusColumns({
  t,
  siteId,
  onDelete,
}: MenusColumnOptions): ColumnDef<MenuResponse, unknown>[] {
  return [
    {
      id: 'key',
      accessorKey: 'key',
      header: t('cms:Menus.Columns.Key', 'Key'),
      cell: ({ row }) => <span className="font-mono text-sm">{row.original.key}</span>,
    },
    {
      id: 'title',
      accessorKey: 'title',
      header: t('cms:Menus.Columns.Title', 'Title'),
      cell: ({ row }) => <span>{row.original.title}</span>,
    },
    {
      id: 'items',
      accessorKey: 'items',
      enableSorting: false,
      header: t('cms:Menus.Columns.Items', 'Items'),
      cell: ({ row }) => <span>{row.original.items.length}</span>,
    },
    {
      id: 'actions',
      enableSorting: false,
      header: t('cms:Menus.Columns.Actions', 'Actions'),
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" asChild>
            <Link
              to={`/cms/sites/${siteId}/menus/${row.original.id}/edit`}
              title={t('cms:Common.Edit', 'Edit')}
              aria-label={t('cms:Common.Edit', 'Edit')}
            >
              <Pencil className="h-4 w-4" />
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            title={t('cms:Common.Delete', 'Delete')}
            aria-label={t('cms:Common.Delete', 'Delete')}
            onClick={() => onDelete(row.original)}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];
}
