import { useTranslation } from '@granit/react-localization';
import { useTemplateMutations } from '@granit/react-templating';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
} from '@granit/react-ui';
import { Trash2, Upload, Undo2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { logger } from '../logger';

import type { TemplateDetail } from '@granit/templating';

type ConfirmAction = 'publish' | 'unpublish' | 'deleteDraft';

interface TemplateLifecycleActionsProps {
  template: TemplateDetail;
}

export function TemplateLifecycleActions({ template }: Readonly<TemplateLifecycleActionsProps>) {
  const { t } = useTranslation();
  const { publish, unpublish, deleteDraft } = useTemplateMutations();
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);

  const hasDraft = !!template.draft;
  const hasPublished = !!template.published;

  const confirmLabels: Record<ConfirmAction, { title: string; description: string }> = {
    publish: {
      title: t('Templates.Actions.Publish'),
      description: t('Templates.Confirm.Publish'),
    },
    unpublish: {
      title: t('Templates.Actions.Unpublish'),
      description: t('Templates.Confirm.Unpublish'),
    },
    deleteDraft: {
      title: t('Templates.Actions.DeleteDraft'),
      description: t('Templates.Confirm.DeleteDraft'),
    },
  };

  const handleConfirm = async () => {
    if (!confirmAction) return;

    try {
      const params = { name: template.name, culture: template.culture ?? undefined };
      if (confirmAction === 'publish') {
        await publish.mutateAsync(params);
        toast.success(t('Templates.Messages.Published'));
      } else if (confirmAction === 'unpublish') {
        await unpublish.mutateAsync(params);
        toast.success(t('Templates.Messages.Unpublished'));
      } else if (confirmAction === 'deleteDraft') {
        await deleteDraft.mutateAsync(params);
        toast.success(t('Templates.Messages.DraftDeleted'));
      }
    } catch (err) {
      // API errors are surfaced by the global MutationCache.onError toast.
      logger.error('[TemplateLifecycleActions] Lifecycle mutation failed', err);
    }
    setConfirmAction(null);
  };

  return (
    <>
      <div data-slot="template-lifecycle-actions" className="flex gap-2">
        {hasDraft && (
          <Button onClick={() => setConfirmAction('publish')}>
            <Upload className="mr-2 h-4 w-4" />
            {t('Templates.Actions.Publish')}
          </Button>
        )}

        {hasPublished && (
          <Button variant="outline" onClick={() => setConfirmAction('unpublish')}>
            <Undo2 className="mr-2 h-4 w-4" />
            {t('Templates.Actions.Unpublish')}
          </Button>
        )}

        {hasDraft && (
          <Button
            variant="destructive"
            size="icon"
            onClick={() => setConfirmAction('deleteDraft')}
            aria-label={t('Templates.Actions.DeleteDraft')}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      <AlertDialog
        open={!!confirmAction}
        onOpenChange={(open) => {
          if (!open) setConfirmAction(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction && confirmLabels[confirmAction].title}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction && confirmLabels[confirmAction].description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('Common.Cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm}>{t('Common.Confirm')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
