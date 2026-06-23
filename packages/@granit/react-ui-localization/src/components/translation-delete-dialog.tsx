import { useGranitClient } from '@granit/react-api-client';
import { useDeleteLocalizationOverride, useTranslation } from '@granit/react-localization';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@granit/react-ui';
import { toast } from 'sonner';

import { logger } from '../logger';

import type { LocalizationOverride } from '@granit/localization';

interface TranslationDeleteDialogProps {
  readonly override: LocalizationOverride | null;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  /** Called after a successful delete (e.g. to refresh the grid). */
  readonly onSuccess?: () => void;
}

export function TranslationDeleteDialog({
  override,
  open,
  onOpenChange,
  onSuccess,
}: TranslationDeleteDialogProps) {
  const { t } = useTranslation();
  const client = useGranitClient();
  const deleteOverrideMutation = useDeleteLocalizationOverride({ client });

  const handleConfirm = async () => {
    if (!override) return;

    try {
      await deleteOverrideMutation.mutateAsync({
        resourceName: override.resourceName,
        cultureName: override.cultureName,
        key: override.key,
      });
      toast.success(t('Localization.DeleteSuccess'));
      onSuccess?.();
      onOpenChange(false);
    } catch (err) {
      // API errors are surfaced by the global MutationCache.onError toast.
      logger.error('[TranslationDelete] Delete override failed', err);
    }
  };

  if (!override) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent data-slot="translation-delete-dialog">
        <AlertDialogHeader>
          <AlertDialogTitle>{t('Localization.DeleteDialog.Title')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('Localization.DeleteDialog.Message', {
              key: override.key,
              culture: override.cultureName,
            })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('Common.Cancel')}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={deleteOverrideMutation.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {t('Common.Confirm')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
