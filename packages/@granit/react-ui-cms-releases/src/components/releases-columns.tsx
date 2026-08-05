import { Badge, Button } from '@granit/react-ui';
import { Eye, Send } from 'lucide-react';

import type { ReleaseResponse, ReleaseStatus } from '@granit/cms';
import type { useDateFormatter, useTranslation } from '@granit/react-localization';
import type { ColumnDef } from '@tanstack/react-table';

type TranslateFn = ReturnType<typeof useTranslation>['t'];
type FormatDateFn = ReturnType<typeof useDateFormatter>['formatDate'];

interface ReleasesColumnOptions {
  readonly t: TranslateFn;
  readonly formatDate: FormatDateFn;
  readonly onView: (release: ReleaseResponse) => void;
  readonly onPublish: (release: ReleaseResponse) => void;
}

function statusBadge(status: ReleaseStatus, t: TranslateFn) {
  const variantMap: Record<ReleaseStatus, 'secondary' | 'default' | 'outline' | 'destructive'> = {
    Draft: 'secondary',
    Ready: 'default',
    Running: 'default',
    Done: 'outline',
    Failed: 'destructive',
  };
  const labelMap: Record<ReleaseStatus, string> = {
    Draft: t('cms:Releases.Status.Draft', 'Draft'),
    Ready: t('cms:Releases.Status.Ready', 'Ready'),
    Running: t('cms:Releases.Status.Running', 'Running'),
    Done: t('cms:Releases.Status.Done', 'Done'),
    Failed: t('cms:Releases.Status.Failed', 'Failed'),
  };
  return <Badge variant={variantMap[status]}>{labelMap[status]}</Badge>;
}

/**
 * Columns for the releases admin grid (`MapGranitQuery<Release>` → `ReleaseResponse`).
 * Server-driven sort/filter/pagination is owned by the surrounding
 * `QueryEndpointDataTable`. Releases are cancelled in the detail page — there is
 * no delete action; the row only exposes view and (when `Ready`) publish.
 */
export function createReleasesColumns({
  t,
  formatDate,
  onView,
  onPublish,
}: ReleasesColumnOptions): ColumnDef<ReleaseResponse, unknown>[] {
  return [
    {
      id: 'name',
      accessorKey: 'name',
      header: t('cms:Releases.Columns.Name', 'Name'),
      cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
    },
    {
      id: 'status',
      accessorKey: 'status',
      header: t('cms:Releases.Columns.Status', 'Status'),
      cell: ({ row }) => statusBadge(row.original.status, t),
    },
    {
      id: 'schedule',
      enableSorting: false,
      header: t('cms:Releases.Columns.Schedule', 'Schedule'),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.schedule?.scheduledAtUtc
            ? formatDate(row.original.schedule.scheduledAtUtc)
            : '—'}
        </span>
      ),
    },
    {
      id: 'actionCount',
      enableSorting: false,
      header: t('cms:Releases.Columns.Actions', 'Actions'),
      cell: ({ row }) => <span>{row.original.actions.length}</span>,
    },
    {
      id: 'rowActions',
      enableSorting: false,
      header: t('cms:Common.Actions', 'Actions'),
      cell: ({ row }) => {
        const release = row.original;
        return (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onView(release)}
              title={t('cms:Releases.Actions.View', 'View')}
              aria-label={t('cms:Releases.Actions.View', 'View')}
            >
              <Eye className="h-4 w-4" />
            </Button>
            {release.status === 'Ready' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onPublish(release)}
                title={t('cms:Releases.Actions.Publish', 'Publish')}
                aria-label={t('cms:Releases.Actions.Publish', 'Publish')}
              >
                <Send className="h-4 w-4" />
              </Button>
            )}
          </div>
        );
      },
    },
  ];
}
