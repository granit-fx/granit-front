import { Badge, Button, StatusBadge } from '@granit/react-ui';
import { Pencil, Trash2 } from 'lucide-react';

import type { BlogPostGridRow, BlogPostStatus } from '@granit/blog';
import type { useTranslation } from '@granit/react-localization';
import type { StatusBadgeIntent } from '@granit/react-ui';
import type { ColumnDef } from '@tanstack/react-table';

type TranslateFn = ReturnType<typeof useTranslation>['t'];

interface PostsColumnOptions {
  readonly t: TranslateFn;
  readonly onEdit: (post: BlogPostGridRow) => void;
  readonly onDelete: (post: BlogPostGridRow) => void;
  /** When false, the edit/delete actions are hidden (read-only viewers). */
  readonly canManage: boolean;
}

const STATUS_INTENT: Record<BlogPostStatus, StatusBadgeIntent> = {
  Draft: 'neutral',
  Scheduled: 'warning',
  Published: 'success',
};

function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toISOString().slice(0, 10);
}

/**
 * Columns for the posts admin grid (`MapGranitQuery<BlogPost>` → `BlogPostGridRow`).
 * Server-driven sort/filter/pagination is owned by the surrounding
 * `QueryEndpointDataTable`. Edit/delete actions render only when `canManage`.
 */
export function createPostsColumns({
  t,
  onEdit,
  onDelete,
  canManage,
}: PostsColumnOptions): ColumnDef<BlogPostGridRow, unknown>[] {
  const columns: ColumnDef<BlogPostGridRow, unknown>[] = [
    {
      id: 'slug',
      accessorKey: 'slug',
      header: t('blog:Posts.Columns.Slug', 'Slug'),
      cell: ({ row }) => <span className="font-mono text-sm">{row.original.slug}</span>,
    },
    {
      id: 'authorDisplayName',
      accessorKey: 'authorDisplayName',
      enableSorting: false,
      header: t('blog:Posts.Columns.Author', 'Author'),
      cell: ({ row }) => <span>{row.original.authorDisplayName}</span>,
    },
    {
      id: 'status',
      accessorKey: 'status',
      header: t('blog:Posts.Columns.Status', 'Status'),
      cell: ({ row }) => (
        <StatusBadge intent={STATUS_INTENT[row.original.status]}>
          {t(`blog:Posts.Status.${row.original.status}`, row.original.status)}
        </StatusBadge>
      ),
    },
    {
      id: 'publishedAt',
      accessorKey: 'publishedAt',
      header: t('blog:Posts.Columns.PublishedAt', 'Published'),
      cell: ({ row }) => {
        const { status, scheduledAtUtc, publishedAt } = row.original;
        if (status === 'Scheduled' && scheduledAtUtc) {
          return (
            <Badge variant="secondary" className="font-mono text-xs">
              {formatDate(scheduledAtUtc)}
            </Badge>
          );
        }
        return <span className="text-sm text-muted-foreground">{formatDate(publishedAt)}</span>;
      },
    },
  ];

  if (canManage) {
    columns.push({
      id: 'actions',
      enableSorting: false,
      header: t('blog:Posts.Columns.Actions', 'Actions'),
      cell: ({ row }) => {
        const post = row.original;
        return (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              title={t('blog:Common.Edit', 'Edit')}
              aria-label={t('blog:Common.Edit', 'Edit')}
              onClick={() => onEdit(post)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              title={t('blog:Common.Delete', 'Delete')}
              aria-label={t('blog:Common.Delete', 'Delete')}
              onClick={() => onDelete(post)}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        );
      },
    });
  }

  return columns;
}
