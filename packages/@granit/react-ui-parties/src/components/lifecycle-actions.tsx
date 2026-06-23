import { useTranslation } from '@granit/react-localization';
import {
  useActivatePartyMutation,
  useArchivePartyMutation,
  useSuspendPartyMutation,
} from '@granit/react-parties';
import {
  Button,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  toast,
} from '@granit/react-ui';
import { Archive, PauseCircle, PlayCircle } from 'lucide-react';
import { useState } from 'react';

import { logger } from '../logger';

import type { PartyId, PartyStatus } from '@granit/parties';

interface LifecycleActionsProps {
  readonly partyId: PartyId;
  readonly status: PartyStatus;
}

type DialogKind = 'archive' | null;

export function LifecycleActions({ partyId, status }: LifecycleActionsProps) {
  const { t } = useTranslation();
  const suspend = useSuspendPartyMutation();
  const activate = useActivatePartyMutation();
  const archive = useArchivePartyMutation();
  const [dialog, setDialog] = useState<DialogKind>(null);

  const isPending = suspend.isPending || activate.isPending || archive.isPending;

  const handleSuspend = async () => {
    try {
      await suspend.mutateAsync({ id: partyId });
      toast.success(t('Parties.Lifecycle.SuspendSuccess'));
    } catch (err) {
      // API errors are surfaced by the global MutationCache.onError toast.
      logger.error('[LifecycleActions] suspend failed', err);
    }
  };

  const handleActivate = async () => {
    try {
      await activate.mutateAsync(partyId);
      toast.success(t('Parties.Lifecycle.ActivateSuccess'));
    } catch (err) {
      // API errors are surfaced by the global MutationCache.onError toast.
      logger.error('[LifecycleActions] activate failed', err);
    }
  };

  const handleArchive = async () => {
    try {
      await archive.mutateAsync(partyId);
      toast.success(t('Parties.Lifecycle.ArchiveSuccess'));
      setDialog(null);
    } catch (err) {
      // API errors are surfaced by the global MutationCache.onError toast.
      logger.error('[LifecycleActions] archive failed', err);
    }
  };

  if (status === 'Archived') {
    return (
      <span data-slot="lifecycle-actions" className="text-sm text-muted-foreground">
        {t('Parties.Lifecycle.ArchivedHint')}
      </span>
    );
  }

  return (
    <div data-slot="lifecycle-actions" className="flex flex-wrap gap-2">
      {status === 'Active' && (
        <Button variant="outline" size="sm" onClick={handleSuspend} disabled={isPending}>
          <PauseCircle className="mr-1 h-4 w-4" />
          {t('Parties.Lifecycle.Suspend')}
        </Button>
      )}
      {status === 'Suspended' && (
        <Button variant="outline" size="sm" onClick={handleActivate} disabled={isPending}>
          <PlayCircle className="mr-1 h-4 w-4" />
          {t('Parties.Lifecycle.Activate')}
        </Button>
      )}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setDialog('archive')}
        disabled={isPending}
        className="text-destructive hover:bg-destructive/10"
      >
        <Archive className="mr-1 h-4 w-4" />
        {t('Parties.Lifecycle.Archive')}
      </Button>

      <AlertDialog open={dialog === 'archive'} onOpenChange={(o) => !o && setDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('Parties.Lifecycle.ArchiveConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('Parties.Lifecycle.ArchiveConfirmDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={archive.isPending}>{t('Common.Cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleArchive}
              disabled={archive.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {archive.isPending ? t('Common.Loading') : t('Parties.Lifecycle.Archive')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
