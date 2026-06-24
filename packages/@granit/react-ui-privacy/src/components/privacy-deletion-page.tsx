import { useDateFormatter, useTranslation } from '@granit/react-localization';
import { useDeletionRequests, useRequestDeletion } from '@granit/react-privacy';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Checkbox,
  Label,
  Textarea,
  toast,
} from '@granit/react-ui';
import { AlertTriangle, Info, Loader2, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { logger } from '../logger';

import { DeletionRequestTable } from './deletion-request-table';

export function PrivacyDeletionPage() {
  const { t } = useTranslation();
  const { formatDateTime } = useDateFormatter();
  const { data: requests } = useDeletionRequests();
  const { mutateAsync: doDelete, isPending } = useRequestDeletion();

  const hasPendingRequest = requests?.some((r) => r.state === 'Deferred') ?? false;

  const [reason, setReason] = useState('');
  const [defer, setDefer] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleSubmit = () => {
    setConfirmOpen(true);
  };

  const handleConfirm = async () => {
    try {
      const response = await doDelete({ reason, defer });
      if (defer) {
        toast.success(
          t('Privacy.Deletion.RequestSuccessDeferred', {
            date: formatDateTime(response.scheduledDeletionAt),
          })
        );
      } else {
        toast.success(t('Privacy.Deletion.RequestSuccess'));
      }
      setReason('');
      setDefer(false);
      setConfirmOpen(false);
    } catch (err) {
      // API errors are surfaced by the global MutationCache.onError toast.
      logger.error('[PrivacyDeletion] Request deletion failed', err);
      setConfirmOpen(false);
    }
  };

  return (
    <div data-slot="privacy-deletion-page" className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">{t('Privacy.Deletion.Title')}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t('Privacy.Deletion.Subtitle')}</p>
      </div>

      <Card className="border-destructive/50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-5 text-destructive" />
            <CardTitle>{t('Privacy.Deletion.WarningTitle')}</CardTitle>
          </div>
          <CardDescription className="text-destructive">
            {t('Privacy.Deletion.WarningDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {hasPendingRequest && (
            <div className="flex items-center gap-2 rounded-md border border-orange-500/25 bg-orange-500/10 p-3 text-sm text-orange-600 dark:text-orange-400">
              <Info className="size-4 shrink-0" />
              {t('Privacy.Deletion.PendingRequestWarning')}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="deletion-reason">{t('Privacy.Deletion.ReasonLabel')}</Label>
            <Textarea
              id="deletion-reason"
              placeholder={t('Privacy.Deletion.ReasonPlaceholder')}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              disabled={hasPendingRequest}
            />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Checkbox
                id="defer-deletion"
                checked={defer}
                onCheckedChange={(checked) => setDefer(checked === true)}
                disabled={hasPendingRequest}
              />
              <Label htmlFor="defer-deletion" className="cursor-pointer">
                {t('Privacy.Deletion.DeferLabel')}
              </Label>
            </div>
            {defer && (
              <p className="ml-6 text-xs text-muted-foreground">
                {t('Privacy.Deletion.DeferDescription')}
              </p>
            )}
          </div>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={!reason.trim() || isPending || hasPendingRequest}
          >
            {isPending ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Trash2 className="mr-2 size-4" />
            )}
            {t('Privacy.Deletion.RequestButton')}
          </Button>
        </CardContent>
      </Card>

      <DeletionRequestTable />

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('Privacy.Deletion.ConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {defer
                ? t('Privacy.Deletion.ConfirmDescriptionDeferred')
                : t('Privacy.Deletion.ConfirmDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('Common.Cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('Privacy.Deletion.ConfirmButton')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
