import { useProfile, useUpdateProfile } from '@granit/react-account';
import { useTranslation } from '@granit/react-localization';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Spinner,
  toast,
} from '@granit/react-ui';
import { useState } from 'react';

import { logger } from './logger';

export function ProfilePage() {
  const { t } = useTranslation();
  const { data: profile, isLoading } = useProfile();
  const update = useUpdateProfile();
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({ firstName: '', lastName: '' });

  function startEditing() {
    setForm({
      firstName: profile?.firstName ?? '',
      lastName: profile?.lastName ?? '',
    });
    setIsEditing(true);
  }

  async function handleSave() {
    try {
      await update.mutateAsync({ firstName: form.firstName, lastName: form.lastName });
      setIsEditing(false);
      toast.success(t('Account.Profile.SaveSuccess', 'Profile updated.'));
    } catch (err) {
      // API errors are surfaced by the global MutationCache.onError toast.
      logger.error('[Profile] Update failed', err);
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div data-slot="profile-page" className="mx-auto max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">
          {t('Account.Profile.Title', 'My Profile')}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('Account.Profile.Subtitle', 'Manage your personal information')}
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t('Account.Profile.CardTitle', 'Profile information')}</CardTitle>
          {!isEditing && (
            <Button variant="outline" size="sm" onClick={startEditing}>
              {t('Common.Edit')}
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">{t('Account.Profile.FirstName', 'First name')}</Label>
                  <Input
                    id="firstName"
                    value={form.firstName}
                    onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">{t('Account.Profile.LastName', 'Last name')}</Label>
                  <Input
                    id="lastName"
                    value={form.lastName}
                    onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSave} disabled={update.isPending}>
                  {update.isPending ? t('Common.Loading') : t('Common.Save')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(false)}
                  disabled={update.isPending}
                >
                  {t('Common.Cancel')}
                </Button>
              </div>
            </div>
          ) : (
            <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm text-muted-foreground">
                  {t('Account.Profile.FirstName', 'First name')}
                </dt>
                <dd className="mt-1 font-medium text-foreground">
                  {profile?.firstName || <span className="text-muted-foreground/60">—</span>}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">
                  {t('Account.Profile.LastName', 'Last name')}
                </dt>
                <dd className="mt-1 font-medium text-foreground">
                  {profile?.lastName || <span className="text-muted-foreground/60">—</span>}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-sm text-muted-foreground">
                  {t('Account.Profile.Email', 'Email')}
                </dt>
                <dd className="mt-1 text-foreground">{profile?.email}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">
                  {t('Account.Profile.EmailConfirmed', 'Email confirmed')}
                </dt>
                <dd className="mt-1 text-foreground">
                  {profile?.emailConfirmed ? t('Common.Yes', 'Yes') : t('Common.No', 'No')}
                </dd>
              </div>
            </dl>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
