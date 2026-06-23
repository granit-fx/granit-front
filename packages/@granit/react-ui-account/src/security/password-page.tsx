import { useChangePassword } from '@granit/react-account';
import { useTranslation } from '@granit/react-localization';
import {
  toast,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
} from '@granit/react-ui';
import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

import { logger } from '../logger';

interface PasswordForm {
  currentPassword: string;
  newPassword: string;
}

export function PasswordPage() {
  const { t } = useTranslation();
  const changePassword = useChangePassword();
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState<PasswordForm>({ currentPassword: '', newPassword: '' });
  const [hasError, setHasError] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await changePassword.mutateAsync({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      setForm({ currentPassword: '', newPassword: '' });
      toast.success(t('Account.Password.ChangeSuccess', 'Password changed successfully.'));
    } catch (err) {
      // API errors are surfaced by the global MutationCache.onError toast;
      // flag the field so it reads as invalid, like a pre-submit validation.
      setHasError(true);
      logger.error('[Password] Change failed', err);
    }
  }

  return (
    <div data-slot="password-page" className="mx-auto max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">
          {t('Account.Password.Title', 'Change password')}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('Account.Password.Subtitle', 'Update your account password')}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('Account.Password.CardTitle', 'New password')}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">
                {t('Account.Password.CurrentPassword', 'Current password')}
              </Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrent ? 'text' : 'password'}
                  value={form.currentPassword}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, currentPassword: e.target.value }));
                    if (hasError) setHasError(false);
                  }}
                  autoComplete="current-password"
                  aria-invalid={hasError || undefined}
                  aria-describedby={hasError ? 'currentPassword-error' : undefined}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  onClick={() => setShowCurrent((v) => !v)}
                  aria-label={showCurrent ? 'Hide password' : 'Show password'}
                >
                  {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {hasError && (
                <p id="currentPassword-error" className="text-sm text-destructive">
                  {t('Account.Password.WrongCurrentPassword', 'Current password is incorrect.')}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">
                {t('Account.Password.NewPassword', 'New password')}
              </Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNew ? 'text' : 'password'}
                  value={form.newPassword}
                  onChange={(e) => setForm((f) => ({ ...f, newPassword: e.target.value }))}
                  autoComplete="new-password"
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  onClick={() => setShowNew((v) => !v)}
                  aria-label={showNew ? 'Hide password' : 'Show password'}
                >
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" disabled={changePassword.isPending}>
              {changePassword.isPending
                ? t('Common.Loading')
                : t('Account.Password.Submit', 'Change password')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
