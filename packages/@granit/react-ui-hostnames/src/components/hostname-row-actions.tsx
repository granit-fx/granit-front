import {
  useClearPrimary,
  useDeleteHostname,
  useSetPrimary,
  useVerifyNow,
} from '@granit/react-hostnames';
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
  AlertDialogTrigger,
  Button,
} from '@granit/react-ui';
import { Loader2, RefreshCw, Star, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import type { ManagedHostnameResponse } from '@granit/hostnames';

interface RowActionsProps {
  readonly hostname: ManagedHostnameResponse;
  readonly canManage: boolean;
}

export function RowActions({ hostname, canManage }: RowActionsProps) {
  const { t } = useTranslation();
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
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            title={t('Hostnames.Actions.Delete')}
          >
            <Trash2 className="size-3.5 text-destructive" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('Hostnames.Delete.Title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('Hostnames.Delete.Description', { host: hostname.host })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('Hostnames.Delete.Cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('Hostnames.Delete.Confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
