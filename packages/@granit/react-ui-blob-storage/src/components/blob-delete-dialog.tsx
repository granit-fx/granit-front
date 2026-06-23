import { useTranslation } from '@granit/react-localization';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Label,
  Textarea,
} from '@granit/react-ui';
import { useState } from 'react';

import type { BlobDescriptorListItem } from '@granit/blob-storage';

interface BlobDeleteDialogProps {
  readonly blob: BlobDescriptorListItem | null;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onConfirm: (deletionReason: string | undefined) => void;
  readonly isPending: boolean;
}

export function BlobDeleteDialog({
  blob,
  open,
  onOpenChange,
  onConfirm,
  isPending,
}: BlobDeleteDialogProps) {
  const { t } = useTranslation();
  const [reason, setReason] = useState('');
  // Derived-state pattern: reset reason when the dialog opens for a new blob
  // without an effect (React recommended approach for prop-derived state).
  const [trackedId, setTrackedId] = useState<string | null>(blob?.id ?? null);
  if (open && blob?.id !== trackedId) {
    setTrackedId(blob?.id ?? null);
    setReason('');
  }

  const handleConfirm = () => {
    const trimmed = reason.trim();
    onConfirm(trimmed.length > 0 ? trimmed : undefined);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('BlobStorage.DeleteDialog.Title', 'Delete file')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('BlobStorage.DeleteDialog.Description', {
              defaultValue:
                'This will permanently delete "{{name}}". This action cannot be undone — the file content is crypto-shredded on the server.',
              name: blob?.originalFileName ?? '',
            })}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2">
          <Label htmlFor="blob-delete-reason">
            {t('BlobStorage.DeleteDialog.ReasonLabel', 'Reason (optional)')}
          </Label>
          <Textarea
            id="blob-delete-reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder={t(
              'BlobStorage.DeleteDialog.ReasonPlaceholder',
              'Why is this file being deleted?'
            )}
            rows={3}
            disabled={isPending}
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>{t('Common.Cancel', 'Cancel')}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isPending}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {isPending ? '…' : t('Common.Delete', 'Delete')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
