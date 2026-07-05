import { BlogErrorCodes } from '@granit/blog';
import { useTranslation } from '@granit/react-localization';
import { ConfirmActionDialog } from '@granit/react-ui-kit';

import type { BlogConflict } from '@granit/react-blog';

export interface PostConflictDialogProps {
  readonly conflict: BlogConflict | null;
  readonly onReload: () => void;
  readonly onDismiss: () => void;
}

/**
 * Reload prompt shown when a metadata/draft save returns `409`
 * (`DraftConcurrency` / `StalePost` / `PostSlugConflict`): the on-screen copy is
 * stale, so the only safe recovery is to reload the latest and re-apply.
 */
export function PostConflictDialog({ conflict, onReload, onDismiss }: PostConflictDialogProps) {
  const { t } = useTranslation();

  const description =
    conflict?.code === BlogErrorCodes.PostSlugConflict
      ? t('blog:Conflict.Slug', 'That slug is already in use. Pick another and try again.')
      : t(
          'blog:Conflict.Stale',
          'This post was changed elsewhere since you loaded it. Reload to get the latest version, then re-apply your changes.'
        );

  return (
    <ConfirmActionDialog
      open={conflict !== null}
      onOpenChange={(open) => {
        if (!open) onDismiss();
      }}
      tone="default"
      title={t('blog:Conflict.Title', 'This post changed elsewhere')}
      aria-label={t('blog:Conflict.Title', 'This post changed elsewhere')}
      description={description}
      confirmLabel={t('blog:Conflict.Reload', 'Reload latest')}
      cancelLabel={t('blog:Common.Cancel', 'Cancel')}
      onConfirm={() => {
        onReload();
        onDismiss();
      }}
    />
  );
}
