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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from '@granit/react-ui';
import { useState } from 'react';
import { toast } from 'sonner';

import { useLanguages } from '../languages-context';
import { logger } from '../logger';

interface TranslationCreateDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  /** Called after a successful create (e.g. to refresh the grid). */
  readonly onCreated?: () => void;
}

const EMPTY_FORM = { resourceName: '', cultureName: '', key: '', value: '' };

/**
 * Create a brand-new translation override (resource + culture + key + value).
 *
 * Wraps the upsert `PUT /overrides/{resource}/{culture}/{key}` — the same
 * endpoint as edit — but with all identifying fields editable, so an override
 * can be created for a key that has none yet (edit only changes the value of an
 * existing row).
 */
export function TranslationCreateDialog({
  open,
  onOpenChange,
  onCreated,
}: TranslationCreateDialogProps) {
  const { t } = useTranslation();
  const client = useGranitClient();
  const languages = useLanguages();
  const setOverrideMutation = useSetLocalizationOverride({ client });
  const [form, setForm] = useState(EMPTY_FORM);

  const isValid =
    form.resourceName.trim() !== '' &&
    form.cultureName.trim() !== '' &&
    form.key.trim() !== '' &&
    form.value.trim() !== '';

  const handleOpenChange = (next: boolean) => {
    if (!next) setForm(EMPTY_FORM);
    onOpenChange(next);
  };

  const handleCreate = async () => {
    if (!isValid) return;
    try {
      await setOverrideMutation.mutateAsync({
        resourceName: form.resourceName.trim(),
        cultureName: form.cultureName.trim(),
        key: form.key.trim(),
        value: form.value.trim(),
      });
      toast.success(t('Localization.SaveSuccess'));
      onCreated?.();
      handleOpenChange(false);
    } catch (err) {
      // API errors are surfaced by the global MutationCache.onError toast.
      logger.error('[TranslationCreate] Create override failed', err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent data-slot="translation-create-dialog" className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('Localization.CreateDialog.Title')}</DialogTitle>
          <DialogDescription>{t('Localization.CreateDialog.Description')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="create-resource">{t('Localization.Columns.ResourceName')}</Label>
              <Input
                id="create-resource"
                value={form.resourceName}
                onChange={(e) => setForm((f) => ({ ...f, resourceName: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-culture">{t('Localization.Columns.CultureName')}</Label>
              <Select
                value={form.cultureName}
                onValueChange={(value) => setForm((f) => ({ ...f, cultureName: value }))}
              >
                <SelectTrigger id="create-culture">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((lang) => (
                    <SelectItem key={lang.cultureName} value={lang.cultureName}>
                      {lang.displayName} ({lang.cultureName})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="create-key">{t('Localization.Columns.Key')}</Label>
            <Input
              id="create-key"
              value={form.key}
              onChange={(e) => setForm((f) => ({ ...f, key: e.target.value }))}
              className="font-mono"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="create-value">{t('Localization.EditDialog.Value')}</Label>
            <Textarea
              id="create-value"
              value={form.value}
              onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
              rows={3}
              maxLength={4000}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            {t('Common.Cancel')}
          </Button>
          <Button onClick={handleCreate} disabled={!isValid || setOverrideMutation.isPending}>
            {t('Common.Create')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
