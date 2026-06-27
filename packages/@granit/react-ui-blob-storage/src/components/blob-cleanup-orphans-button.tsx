import { useCleanupOrphans } from '@granit/react-blob-storage';
import { useTranslation } from '@granit/react-localization';
import { Button, toast } from '@granit/react-ui';
import { ConfirmActionDialog } from '@granit/react-ui-kit';
import { Trash2 } from 'lucide-react';
import { useState } from 'react';

import { logger } from '../logger';

export function BlobCleanupOrphansButton() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const cleanup = useCleanupOrphans();

  const handleConfirm = async () => {
    try {
      const result = await cleanup.mutateAsync();
      toast.success(
        t('BlobStorage.CleanupOrphans.Success', {
          defaultValue: '{{count}} orphan blob cleaned up',
          defaultValue_other: '{{count}} orphan blobs cleaned up',
          count: result.cleanedCount,
        })
      );
      setOpen(false);
    } catch (err) {
      // API errors are surfaced by the global MutationCache.onError toast.
      logger.error('[BlobCleanupOrphans] Failed', err);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        disabled={cleanup.isPending}
      >
        <Trash2 className="h-4 w-4" aria-hidden="true" />
        {t('BlobStorage.CleanupOrphans.Button', 'Cleanup orphans')}
      </Button>

      <ConfirmActionDialog
        open={open}
        onOpenChange={setOpen}
        title={t('BlobStorage.CleanupOrphans.DialogTitle', 'Clean up orphan blobs?')}
        description={t(
          'BlobStorage.CleanupOrphans.DialogDescription',
          'This will delete blobs stuck in "Pending" or "Uploading" state past the orphan threshold. The action is irreversible.'
        )}
        confirmLabel={t('Common.Confirm', 'Confirm')}
        busyLabel="…"
        isPending={cleanup.isPending}
        onConfirm={handleConfirm}
      />
    </>
  );
}
