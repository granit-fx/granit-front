import { useDeleteAccount } from '@granit/react-account';
import { useTranslation } from '@granit/react-localization';
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
} from '@granit/react-ui';
import { AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { logger } from './logger';

function DeleteConfirmDialog({
  open,
  onOpenChange,
  onDeleted,
}: {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onDeleted?: () => void;
}) {
  const { t } = useTranslation();
  const deleteAccount = useDeleteAccount();
  const [password, setPassword] = useState('');
  const [hasError, setHasError] = useState(false);

  async function handleDelete() {
    try {
      await deleteAccount.mutateAsync({ password });
      toast.success(t('Account.Delete.DeletedSuccess', 'Account deleted.'));
      onDeleted?.();
    } catch (err) {
      // API errors are surfaced by the global MutationCache.onError toast;
      // flag the field so it reads as invalid, like a pre-submit validation.
      setHasError(true);
      logger.error('[DeleteAccount] Failed', err);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('Account.Delete.ConfirmTitle', 'Delete account')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {t(
              'Account.Delete.ConfirmMessage',
              'This action cannot be undone. Enter your password to confirm.'
            )}
          </p>
          <div className="space-y-2">
            <Label htmlFor="deletePassword">
              {t('Account.Password.CurrentPassword', 'Current password')}
            </Label>
            <Input
              id="deletePassword"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (hasError) setHasError(false);
              }}
              autoComplete="current-password"
              aria-invalid={hasError || undefined}
              aria-describedby={hasError ? 'deletePassword-error' : undefined}
              autoFocus
            />
            {hasError && (
              <p id="deletePassword-error" className="text-sm text-destructive">
                {t('Account.Delete.WrongPassword', 'Incorrect password.')}
              </p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('Common.Cancel')}
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteAccount.isPending || !password}
          >
            {deleteAccount.isPending
              ? t('Common.Loading')
              : t('Account.Delete.ConfirmButton', 'Delete my account')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface DeleteAccountPageProps {
  /**
   * Called after the account is deleted — the host signs the caller out (its
   * `useAuth().logout`). Lifted to a prop so the package does not depend on the
   * app auth feature.
   */
  readonly onDeleted?: () => void;
}

export function DeleteAccountPage({ onDeleted }: DeleteAccountPageProps = {}) {
  const { t } = useTranslation();
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <div data-slot="delete-account-page" className="mx-auto max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">
          {t('Account.Delete.Title', 'Delete account')}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('Account.Delete.Subtitle', 'Permanently delete your account and all associated data')}
        </p>
      </div>

      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>{t('Account.Delete.WarningTitle', 'Danger zone')}</AlertTitle>
        <AlertDescription>
          {t(
            'Account.Delete.WarningMessage',
            'Deleting your account is permanent and cannot be reversed. All your data will be erased.'
          )}
        </AlertDescription>
      </Alert>

      <div className="rounded-lg border border-destructive/30 p-6">
        <h3 className="mb-2 text-sm font-semibold text-foreground">
          {t('Account.Delete.CardTitle', 'Delete this account')}
        </h3>
        <p className="mb-4 text-sm text-muted-foreground">
          {t(
            'Account.Delete.CardDescription',
            'Once you delete your account, there is no going back. Please be certain.'
          )}
        </p>
        <Button variant="destructive" onClick={() => setConfirmOpen(true)}>
          <AlertTriangle className="mr-2 h-4 w-4" />
          {t('Account.Delete.DeleteButton', 'Delete account')}
        </Button>
      </div>

      <DeleteConfirmDialog open={confirmOpen} onOpenChange={setConfirmOpen} onDeleted={onDeleted} />
    </div>
  );
}
