import { useGranitClient } from '@granit/react-api-client';
import { useSetLocalizationOverride, useTranslation } from '@granit/react-localization';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Textarea,
  toast,
} from '@granit/react-ui';
import { useState } from 'react';

import { logger } from '../logger';

import type { LocalizationOverride } from '@granit/localization';

interface TranslationEditDialogProps {
  readonly override: LocalizationOverride | null;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  /** Called after a successful save (e.g. to refresh the grid). */
  readonly onSuccess?: () => void;
}

export function TranslationEditDialog({
  override,
  open,
  onOpenChange,
  onSuccess,
}: TranslationEditDialogProps) {
  const { t } = useTranslation();
  const client = useGranitClient();
  const setOverrideMutation = useSetLocalizationOverride({ client });
  const [value, setValue] = useState(override?.value ?? '');

  const handleOpen = (isOpen: boolean) => {
    if (isOpen && override) {
      setValue(override.value);
    }
    onOpenChange(isOpen);
  };

  const handleSave = async () => {
    if (!override || !value.trim()) return;

    try {
      await setOverrideMutation.mutateAsync({
        resourceName: override.resourceName,
        cultureName: override.cultureName,
        key: override.key,
        value: value.trim(),
      });
      toast.success(t('Localization.SaveSuccess'));
      onSuccess?.();
      onOpenChange(false);
    } catch (err) {
      // API errors are surfaced by the global MutationCache.onError toast.
      logger.error('[TranslationEdit] Save override failed', err);
    }
  };

  if (!override) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent data-slot="translation-edit-dialog" className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('Localization.EditDialog.Title')}</DialogTitle>
          <DialogDescription>{t('Localization.EditDialog.Description')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('Localization.Columns.ResourceName')}</Label>
              <Input value={override.resourceName} disabled />
            </div>
            <div className="space-y-2">
              <Label>{t('Localization.Columns.CultureName')}</Label>
              <Input value={override.cultureName} disabled />
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t('Localization.Columns.Key')}</Label>
            <Input value={override.key} disabled className="font-mono" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="override-value">{t('Localization.EditDialog.Value')}</Label>
            <Textarea
              id="override-value"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              rows={3}
              maxLength={4000}
              aria-describedby={value.trim() ? undefined : 'value-error'}
            />
            {!value.trim() && (
              <p id="value-error" className="text-sm text-destructive">
                {t('Localization.EditDialog.ValueRequired')}
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('Common.Cancel')}
          </Button>
          <Button onClick={handleSave} disabled={!value.trim() || setOverrideMutation.isPending}>
            {t('Common.Save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
