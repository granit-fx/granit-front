import { Badge, Button } from '@granit/react-ui';
import { Pencil, Trash2 } from 'lucide-react';

import type { BlogPostListItemResponse } from '@granit/blog';
import type { useTranslation } from '@granit/react-localization';
import type { DataTableColumnDef } from '@granit/react-ui-kit';

type TranslateFn = ReturnType<typeof useTranslation>['t'];

interface PostsColumnOptions {
  readonly t: TranslateFn;
  readonly onEdit: (post: BlogPostListItemResponse) => void;
  readonly onDelete: (post: BlogPostListItemResponse) => void;
  /** When false, the edit/delete actions are hidden (read-only viewers). */
  readonly canManage: boolean;
}

function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toISOString().slice(0, 10);
}

/**
 * Columns for the posts admin list (`MapGranitQuery<BlogPost>` → `BlogPostListItemResponse`).
 * The projection carries routing/ownership metadata only (no per-culture title or
 * publication status — those are not SQL-joinable from the aggregate), so the list
 * shows slug / schedule / created date and the editor loads the rest. Server-driven
 * sort/filter/pagination is owned by the surrounding `QueryEndpointDataTable`.
 * Edit/delete actions render only when `canManage`.
 */
export function createPostsColumns({
  t,
  onEdit,
  onDelete,
  canManage,
}: PostsColumnOptions): DataTableColumnDef<BlogPostListItemResponse, unknown>[] {
  const columns: DataTableColumnDef<BlogPostListItemResponse, unknown>[] = [
    {
      id: 'slug',
      accessorKey: 'slug',
      header: t('blog:Posts.Columns.Slug', 'Slug'),
      cell: ({ row }) => <span className="font-mono text-sm">{row.original.slug}</span>,
    },
    {
      id: 'scheduledAtUtc',
      accessorKey: 'scheduledAtUtc',
      header: t('blog:Posts.Columns.Scheduled', 'Scheduled'),
      cell: ({ row }) => {
        const { scheduledAtUtc } = row.original;
        return scheduledAtUtc ? (
          <Badge variant="secondary" className="font-mono text-xs">
            {formatDate(scheduledAtUtc)}
          </Badge>
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        );
      },
    },
    {
      id: 'createdAt',
      accessorKey: 'createdAt',
      header: t('blog:Posts.Columns.Created', 'Created'),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{formatDate(row.original.createdAt)}</span>
      ),
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
