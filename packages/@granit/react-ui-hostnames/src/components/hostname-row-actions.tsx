import {
  useClearPrimary,
  useDeleteHostname,
  useSetPrimary,
  useVerifyNow,
} from '@granit/react-hostnames';
import { useTranslation } from '@granit/react-localization';
import { Button, toast } from '@granit/react-ui';
import { ConfirmActionDialog } from '@granit/react-ui-kit';
import { Loader2, RefreshCw, Star, Trash2 } from 'lucide-react';
import { useState } from 'react';

import type { ManagedHostnameResponse } from '@granit/hostnames';

interface RowActionsProps {
  readonly hostname: ManagedHostnameResponse;
  readonly canManage: boolean;
}

export function RowActions({ hostname, canManage }: RowActionsProps) {
  const { t } = useTranslation();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const setPrimary = useSetPrimary();
  const clearPrimary = useClearPrimary();
  const verifyNow = useVerifyNow();
  const deleteHostname = useDeleteHostname();

  if (!canManage) return null;

  function handleSetPrimary() {
    setPrimary.mutate(hostname.id, {
      onSuccess: () => toast.success(t('Hostnames.SetPrimarySuccess', { host: hostname.host })),
    });
  }

  function handleClearPrimary() {
    clearPrimary.mutate(hostname.id, {
      onSuccess: () => toast.success(t('Hostnames.ClearPrimarySuccess')),
    });
  }

  function handleVerify() {
    verifyNow.mutate(hostname.id, {
      onSuccess: () => toast.success(t('Hostnames.VerifySuccess')),
    });
  }

  function handleDelete() {
    deleteHostname.mutate(hostname.id, {
      onSuccess: () => toast.success(t('Hostnames.DeleteSuccess')),
    });
  }

  return (
    <div className="flex items-center gap-1">
      {!hostname.isPrimary && (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          title={t('Hostnames.Actions.SetPrimary')}
          disabled={setPrimary.isPending}
          onClick={handleSetPrimary}
        >
          <Star className="size-3.5" />
        </Button>
      )}
      {hostname.isPrimary && (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          title={t('Hostnames.Actions.ClearPrimary')}
          disabled={clearPrimary.isPending}
          onClick={handleClearPrimary}
        >
          <Star className="size-3.5 fill-warning-500 text-warning-500" />
        </Button>
      )}
      <Button
        variant="ghost"
        size="sm"
        className="h-7 w-7 p-0"
        title={t('Hostnames.Actions.VerifyNow')}
        disabled={verifyNow.isPending}
        onClick={handleVerify}
      >
        {verifyNow.isPending ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <RefreshCw className="size-3.5" />
        )}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="h-7 w-7 p-0"
        title={t('Hostnames.Actions.Delete')}
        onClick={() => setDeleteOpen(true)}
      >
        <Trash2 className="size-3.5 text-destructive" />
      </Button>
      <ConfirmActionDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        tone="destructive"
        title={t('Hostnames.Delete.Title')}
        description={t('Hostnames.Delete.Description', { host: hostname.host })}
        cancelLabel={t('Hostnames.Delete.Cancel')}
        confirmLabel={t('Hostnames.Delete.Confirm')}
        onConfirm={handleDelete}
      />
    </div>
  );
}
