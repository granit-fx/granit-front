import { useGranitClient } from '@granit/react-api-client';
import { useDeleteLocalizationOverride, useTranslation } from '@granit/react-localization';
import { toast } from '@granit/react-ui';
import { ConfirmActionDialog } from '@granit/react-ui-kit';

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
    <ConfirmActionDialog
      open={open}
      onOpenChange={onOpenChange}
      data-slot="translation-delete-dialog"
      tone="destructive"
      title={t('Localization.DeleteDialog.Title')}
      description={t('Localization.DeleteDialog.Message', {
        key: override.key,
        culture: override.cultureName,
      })}
      confirmLabel={t('Common.Confirm')}
      isPending={deleteOverrideMutation.isPending}
      onConfirm={handleConfirm}
    />
  );
}
