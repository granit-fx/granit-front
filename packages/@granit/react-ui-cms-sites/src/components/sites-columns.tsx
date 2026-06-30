import { Badge, Button } from '@granit/react-ui';
import { FileText, Menu, Network, Pencil, Search, Tag, Trash2, Waypoints } from 'lucide-react';
import { Link } from 'react-router-dom';

import type { SiteResponse } from '@granit/cms';
import type { useTranslation } from '@granit/react-localization';
import type { ColumnDef } from '@tanstack/react-table';
import type { NavigateFunction } from 'react-router-dom';

type TranslateFn = ReturnType<typeof useTranslation>['t'];

interface SitesColumnOptions {
  readonly t: TranslateFn;
  readonly navigate: NavigateFunction;
  readonly onDelete: (site: SiteResponse) => void;
}

/**
 * Columns for the sites admin grid (`MapGranitQuery<Site>` → `SiteResponse`).
 * Server-driven sort/filter/pagination is owned by the surrounding
 * `QueryEndpointDataTable`; the actions column keeps the full nav set (pages,
 * menus, releases, SEO, redirects, hostnames, edit) plus the delete dialog
 * trigger, preserving every `aria-label`.
 */
export function createSitesColumns({
  t,
  navigate,
  onDelete,
}: SitesColumnOptions): ColumnDef<SiteResponse, unknown>[] {
  return [
    {
      id: 'slug',
      accessorKey: 'slug',
      header: t('cms:Sites.Columns.Slug', 'Slug'),
      cell: ({ row }) => <span className="font-mono text-sm">{row.original.slug}</span>,
    },
    {
      id: 'name',
      enableSorting: false,
      header: t('cms:Sites.Columns.Name', 'Name'),
      cell: ({ row }) => (
        <span>{row.original.displayNames?.[row.original.defaultCulture] ?? row.original.slug}</span>
      ),
    },
    {
      id: 'cultures',
      enableSorting: false,
      header: t('cms:Sites.Columns.Cultures', 'Cultures'),
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          {row.original.allowedCultures.map((culture) => (
            <Badge key={culture} variant="secondary" className="font-mono text-xs">
              {culture}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      id: 'activated',
      accessorKey: 'activated',
      header: t('cms:Sites.Columns.Status', 'Status'),
      cell: ({ row }) => (
        <Badge variant={row.original.activated ? 'default' : 'secondary'}>
          {row.original.activated
            ? t('cms:Sites.Status.Active', 'Active')
            : t('cms:Sites.Status.Inactive', 'Inactive')}
        </Badge>
      ),
    },
    {
      id: 'actions',
      enableSorting: false,
      header: t('cms:Sites.Columns.Actions', 'Actions'),
      cell: ({ row }) => {
        const site = row.original;
        return (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/cms/sites/${site.id}/pages`)}
              title={t('cms:Sites.Actions.Pages', 'Pages')}
              aria-label={t('cms:Sites.Actions.Pages', 'Pages')}
            >
              <FileText className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/cms/sites/${site.id}/menus`)}
              title={t('cms:Sites.Actions.Menus', 'Menus')}
              aria-label={t('cms:Sites.Actions.Menus', 'Menus')}
            >
              <Menu className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/cms/sites/${site.id}/releases`)}
              title={t('cms:Sites.Actions.Releases', 'Releases')}
              aria-label={t('cms:Sites.Actions.Releases', 'Releases')}
            >
              <Tag className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/cms/sites/${site.id}/seo`)}
              title={t('cms:Sites.Actions.Seo', 'SEO')}
              aria-label={t('cms:Sites.Actions.Seo', 'SEO')}
            >
              <Search className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/cms/sites/${site.id}/redirects`)}
              title={t('cms:Sites.Actions.Redirects', 'Redirects')}
              aria-label={t('cms:Sites.Actions.Redirects', 'Redirects')}
            >
              <Waypoints className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/cms/sites/${site.id}/hostnames`)}
              title={t('cms:Sites.Actions.Hostnames', 'Hostnames')}
              aria-label={t('cms:Sites.Actions.Hostnames', 'Hostnames')}
            >
              <Network className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              asChild
              title={t('cms:Sites.Actions.Edit', 'Edit')}
              aria-label={t('cms:Sites.Actions.Edit', 'Edit')}
            >
              <Link to={`/cms/sites/${site.id}/edit`}>
                <Pencil className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              title={t('cms:Sites.Actions.Delete', 'Delete')}
              aria-label={t('cms:Sites.Actions.Delete', 'Delete')}
              onClick={() => onDelete(site)}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        );
      },
    },
  ];
}
