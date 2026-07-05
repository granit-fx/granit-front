import { BlogPermissions } from '@granit/blog';
import { usePermissions } from '@granit/react-authorization';
import { useAuthors, useDeleteAuthor } from '@granit/react-blog';
import { useTranslation } from '@granit/react-localization';
import {
  toast,
  Alert,
  AlertDescription,
  Button,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@granit/react-ui';
import { ConfirmActionDialog } from '@granit/react-ui-kit';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

export interface AuthorsListPageProps {
  readonly siteId: string;
  /** Navigate to the create form. Host owns routing. */
  readonly onNewAuthor?: () => void;
  /** Navigate to an author's edit form. */
  readonly onEditAuthor?: (id: string) => void;
}

/** Author-profile admin list for a site (bare array — not a QueryEngine grid). */
export function AuthorsListPage({ siteId, onNewAuthor, onEditAuthor }: AuthorsListPageProps) {
  const { t } = useTranslation();
  const { hasPermission } = usePermissions();
  const canManage = hasPermission(BlogPermissions.Authors.Manage);
  const { data: authors, isLoading, isError } = useAuthors(siteId, { enabled: siteId.length > 0 });
  const deleteAuthor = useDeleteAuthor();
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  function handleDelete(id: string) {
    deleteAuthor.mutate(
      { id, siteId },
      { onSuccess: () => toast.success(t('blog:Authors.DeleteSuccess', 'Author deleted.')) }
    );
  }

  return (
    <div data-slot="blog-authors-list-page" className="space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">
            {t('blog:Authors.Title', 'Authors')}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('blog:Authors.Subtitle', 'Manage author profiles for this site.')}
          </p>
        </div>
        {canManage && (
          <Button onClick={() => onNewAuthor?.()}>
            <Plus className="mr-2 h-4 w-4" />
            {t('blog:Authors.NewAuthor', 'New author')}
          </Button>
        )}
      </header>

      {isError && (
        <Alert variant="destructive">
          <AlertDescription>
            {t('blog:Authors.LoadError', 'Failed to load authors.')}
          </AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Spinner className="h-4 w-4" />
          {t('blog:Common.Loading', 'Loading…')}
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('blog:Authors.Columns.DisplayName', 'Display name')}</TableHead>
              <TableHead>{t('blog:Authors.Columns.UserId', 'User')}</TableHead>
              {canManage && (
                <TableHead className="text-right">{t('blog:Common.Actions', 'Actions')}</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {(authors ?? []).length === 0 ? (
              <TableRow>
                <TableCell colSpan={canManage ? 3 : 2} className="text-sm text-muted-foreground">
                  {t('blog:Authors.Empty', 'No authors yet.')}
                </TableCell>
              </TableRow>
            ) : (
              (authors ?? []).map((author) => (
                <TableRow key={author.id}>
                  <TableCell>{author.displayName}</TableCell>
                  <TableCell className="font-mono text-xs">{author.userId}</TableCell>
                  {canManage && (
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          title={t('blog:Common.Edit', 'Edit')}
                          aria-label={t('blog:Common.Edit', 'Edit')}
                          onClick={() => onEditAuthor?.(author.id)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          title={t('blog:Common.Delete', 'Delete')}
                          aria-label={t('blog:Common.Delete', 'Delete')}
                          onClick={() =>
                            setDeleteTarget({ id: author.id, name: author.displayName })
                          }
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      )}

      <ConfirmActionDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        tone="destructive"
        title={t('blog:Authors.DeleteConfirm.Title', 'Delete author?')}
        aria-label={t('blog:Authors.DeleteConfirm.Title', 'Delete author?')}
        description={t(
          'blog:Authors.DeleteConfirm.Description',
          'This will delete the profile for "{{name}}".',
          { name: deleteTarget?.name ?? '' }
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
