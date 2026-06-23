import { useSendPasswordResetEmail, useSetTemporaryPassword } from '@granit/react-identity';
import { useTranslation } from '@granit/react-localization';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
} from '@granit/react-ui';
import { KeyRound, Mail } from 'lucide-react';
import * as React from 'react';

import { logger } from '../../logger';

import type { UserId } from '@granit/types';

interface UserPasswordCardProps {
  userId: UserId;
}

export function UserPasswordCard({ userId }: Readonly<UserPasswordCardProps>) {
  const { t } = useTranslation();
  const sendReset = useSendPasswordResetEmail();
  const setTempPassword = useSetTemporaryPassword();

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [tempPassword, setTempPassword_] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');

  const passwordsMatch = tempPassword === confirmPassword;
  const canSubmit =
    tempPassword.trim().length >= 8 &&
    confirmPassword.trim().length > 0 &&
    passwordsMatch &&
    !setTempPassword.isPending;

  const resetDialog = () => {
    setTempPassword_('');
    setConfirmPassword('');
    setTempPassword.reset();
  };

  const handleOpenDialog = () => {
    resetDialog();
    setDialogOpen(true);
  };

  const handleSetTempPassword = async () => {
    if (!canSubmit) return;
    try {
      await setTempPassword.mutateAsync({ userId, password: tempPassword });
      setDialogOpen(false);
      resetDialog();
    } catch (err) {
      // Dialog stays open; the error is surfaced to the user via setTempPassword.isError.
      logger.error('[UserPasswordCard] Set temporary password failed', err);
    }
  };

  return (
    <Card data-slot="user-password-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <KeyRound className="h-4 w-4" />
          {t('Users.Password.Title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => sendReset.mutate(userId)}
            disabled={sendReset.isPending}
          >
            <Mail className="mr-2 h-3 w-3" />
            {sendReset.isPending ? t('Common.Loading') : t('Users.Password.SendResetEmail')}
          </Button>
          {sendReset.isSuccess && (
            <span className="text-xs text-success-600">{t('Users.Password.ResetEmailSent')}</span>
          )}
        </div>

        <Button variant="outline" size="sm" onClick={handleOpenDialog}>
          <KeyRound className="mr-2 h-3 w-3" />
          {t('Users.Password.SetTemporary')}
        </Button>

        {setTempPassword.isSuccess && (
          <span className="text-xs text-success-600">
            {t('Users.Password.TemporaryPasswordSet')}
          </span>
        )}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('Users.Password.SetTemporary')}</DialogTitle>
              <DialogDescription>{t('Users.Password.ConfirmDialogDescription')}</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="temp-password">{t('Users.Password.TemporaryPassword')}</Label>
                <Input
                  id="temp-password"
                  type="password"
                  value={tempPassword}
                  onChange={(e) => setTempPassword_(e.target.value)}
                  placeholder={t('Users.Password.TemporaryPasswordPlaceholder')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">
                  {t('Users.Password.ConfirmTemporaryPassword')}
                </Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t('Users.Password.ConfirmTemporaryPasswordPlaceholder')}
                />
                {confirmPassword.length > 0 && !passwordsMatch && (
                  <p className="text-xs text-destructive">
                    {t('Users.Password.PasswordsDoNotMatch')}
                  </p>
                )}
              </div>

              {setTempPassword.isError && (
                <p className="text-xs text-destructive">{t('Users.Password.SetError')}</p>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                {t('Common.Cancel')}
              </Button>
              <Button onClick={handleSetTempPassword} disabled={!canSubmit}>
                {setTempPassword.isPending ? t('Common.Loading') : t('Common.Confirm')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
