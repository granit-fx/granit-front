import { BlogPermissions } from '@granit/blog';
import { usePermissions } from '@granit/react-authorization';
import { useBlogConfig, useDeletePost, usePostsQueryMeta } from '@granit/react-blog';
import { useTranslation } from '@granit/react-localization';
import { QueryProvider, useQueryEndpoint } from '@granit/react-query-engine';
import { Alert, AlertDescription, Button, toast } from '@granit/react-ui';
import { ConfirmActionDialog, QueryEndpointDataTable } from '@granit/react-ui-kit';
import { Plus } from 'lucide-react';
import { useMemo, useState } from 'react';

import { createPostsColumns } from './posts-columns';

import type { BlogPostListItemResponse } from '@granit/blog';
import type { SortEntry } from '@granit/query-engine';

/** Static fallback sort used until `/posts` metadata resolves its `defaultSort`. */
const POSTS_DEFAULT_SORT = '-createdAt';

function parseSort(token: string): readonly SortEntry[] {
  return token.startsWith('-')
    ? [{ field: token.slice(1), direction: 'desc' }]
    : [{ field: token, direction: 'asc' }];
}

export interface PostsListPageProps {
  /** Navigate to the create form. Host owns routing. */
  readonly onNewPost?: () => void;
  /** Navigate to a post's edit surface. */
  readonly onEditPost?: (id: string) => void;
}

export function PostsListPage({ onNewPost, onEditPost }: PostsListPageProps = {}) {
  const { client, basePath } = useBlogConfig();

  return (
    <QueryProvider config={{ client, basePath: `${basePath}/posts` }}>
      <PostsList onNewPost={onNewPost} onEditPost={onEditPost} />
    </QueryProvider>
  );
}

function PostsList({ onNewPost, onEditPost }: PostsListPageProps) {
  const { t } = useTranslation();
  const { hasPermission } = usePermissions();
  const canManage = hasPermission(BlogPermissions.Posts.Manage);
  const { data: meta } = usePostsQueryMeta();
  const deletePost = useDeletePost();
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; slug: string } | null>(null);

  const queryEndpoint = useQueryEndpoint<BlogPostListItemResponse>({
    initialParams: { sort: parseSort(meta?.defaultSort ?? POSTS_DEFAULT_SORT) },
  });
  const isError = queryEndpoint.query.isError;

  const columns = useMemo(
    () =>
      createPostsColumns({
        t,
        canManage,
        onEdit: (post) => onEditPost?.(post.id),
        onDelete: (post) => setDeleteTarget({ id: post.id, slug: post.slug }),
      }),
    [t, canManage, onEditPost]
  );

  function handleDelete(id: string) {
    deletePost.mutate(
      { id },
      { onSuccess: () => toast.success(t('blog:Posts.DeleteSuccess', 'Post deleted.')) }
    );
  }

  return (
    <div data-slot="blog-posts-list-page" className="space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">
            {t('blog:Posts.Title', 'Posts')}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('blog:Posts.Subtitle', 'Author, schedule and publish blog posts.')}
          </p>
        </div>
        {canManage && (
          <Button onClick={() => onNewPost?.()}>
            <Plus className="mr-2 h-4 w-4" />
            {t('blog:Posts.NewPost', 'New post')}
          </Button>
        )}
      </header>

      {isError && (
        <Alert variant="destructive">
          <AlertDescription>{t('blog:Posts.LoadError', 'Failed to load posts.')}</AlertDescription>
        </Alert>
      )}

      <QueryEndpointDataTable queryEndpoint={queryEndpoint} columns={columns} />

      <ConfirmActionDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        tone="destructive"
        title={t('blog:Posts.DeleteConfirm.Title', 'Delete post?')}
        aria-label={t('blog:Posts.DeleteConfirm.Title', 'Delete post?')}
        description={t(
          'blog:Posts.DeleteConfirm.Description',
          'This will permanently delete "{{slug}}" and its content in every culture.',
          { slug: deleteTarget?.slug ?? '' }
        )}
        confirmLabel={t('blog:Common.Delete', 'Delete')}
        cancelLabel={t('blog:Common.Cancel', 'Cancel')}
        onConfirm={() => {
          if (deleteTarget) handleDelete(deleteTarget.id);
          setDeleteTarget(null);
        }}
      />
    </div>
  );
}
