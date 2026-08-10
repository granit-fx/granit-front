import { useTranslation } from '@granit/react-localization';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@granit/react-ui';

import type { ReferenceDataResponse } from './types';

interface ReferenceDataDeactivateDialogProps {
  readonly entry: ReferenceDataResponse | null;
  readonly action: 'deactivate' | 'reactivate';
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onConfirm: () => void;
  readonly isPending?: boolean;
  readonly i18nPrefix?: string;
}

export function ReferenceDataDeactivateDialog({
  entry,
  action,
  open,
  onOpenChange,
  onConfirm,
  isPending = false,
  i18nPrefix = 'ReferenceData.Common',
}: ReferenceDataDeactivateDialogProps) {
  const { t } = useTranslation();

  if (!entry) return null;

  const titleKey =
    action === 'deactivate'
      ? `${i18nPrefix}.DeactivateDialog.DeactivateTitle`
      : `${i18nPrefix}.DeactivateDialog.ReactivateTitle`;

  const messageKey =
    action === 'deactivate'
      ? `${i18nPrefix}.DeactivateDialog.DeactivateMessage`
      : `${i18nPrefix}.DeactivateDialog.ReactivateMessage`;

  const confirmLabelKey =
    action === 'deactivate'
      ? `${i18nPrefix}.Actions.Deactivate`
      : `${i18nPrefix}.Actions.Reactivate`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-slot="reference-data-deactivate-dialog">
        <DialogHeader>
          <DialogTitle>{t(titleKey)}</DialogTitle>
          <DialogDescription>
            {t(messageKey, { name: entry.labelEn, code: entry.code })}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            {t('Common.Cancel')}
          </Button>
          <Button
            variant={action === 'deactivate' ? 'destructive' : 'default'}
            onClick={onConfirm}
            disabled={isPending}
          >
            {isPending ? '...' : t(confirmLabelKey)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
