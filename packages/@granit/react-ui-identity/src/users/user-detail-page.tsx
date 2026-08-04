import { usePermissions } from '@granit/react-authorization';
import {
  useIdentityRgpd,
  usePasswordChangedAt,
  useProviderUser,
  useSetUserEnabled,
  useUpdateUser,
} from '@granit/react-identity';
import { useDateFormatter, useTranslation } from '@granit/react-localization';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Separator,
  Spinner,
  toast,
} from '@granit/react-ui';
import { DetailAsideLayout, DetailAsideMobileTrigger } from '@granit/react-ui-kit';
import { toEntityId } from '@granit/types';
import { AlertTriangle, ArrowLeft, AlertCircle, Pencil, Trash2 } from 'lucide-react';
import * as React from 'react';
import { Link, useParams } from 'react-router';

import { logger } from '../logger';

import { UserAttributesCard } from './components/user-attributes-card';
import { UserDevicesCard } from './components/user-devices-card';
import { UserGroupsEditor } from './components/user-groups-editor';
import { UserPasswordCard } from './components/user-password-card';
import { UserSessionsCard } from './components/user-sessions-card';
import { UserStatusToggle } from './components/user-status-toggle';

import type { UserId } from '@granit/types';

export interface UserDetailPageProps {
  /**
   * Renders the right-hand activity aside (e.g. an entity timeline). Showcase-
   * owned: the host supplies whatever activity feed it has for the user. When
   * omitted, the aside is empty.
   */
  readonly renderActivityAside?: (userId: string) => React.ReactNode;
  /** Title for the activity aside panel (defaults to the timeline title key). */
  readonly activityAsideTitle?: string;
}

export function UserDetailPage({ renderActivityAside, activityAsideTitle }: UserDetailPageProps) {
  const { t } = useTranslation();
  const { formatTimeAgo } = useDateFormatter();
  const { id } = useParams<{ id: string }>();
  const userId = id ? (toEntityId<'User'>(id) as UserId) : ('' as UserId);
  const { data: user, isLoading, error } = useProviderUser(userId);
  const { hasPermission } = usePermissions();

  const [isEditing, setIsEditing] = React.useState(false);
  const [editForm, setEditForm] = React.useState({ firstName: '', lastName: '', email: '' });
  const setUserEnabled = useSetUserEnabled();
  const updateUser = useUpdateUser();
  const { data: passwordInfo } = usePasswordChangedAt(userId);
  const { erase } = useIdentityRgpd();
  const canManageCache = hasPermission('Identity.Cache.Manage');
  const [eraseConfirm, setEraseConfirm] = React.useState(false);

  React.useEffect(() => {
    if (user) {
      setEditForm({
        firstName: user.firstName ?? '',
        lastName: user.lastName ?? '',
        email: user.email ?? '',
      });
    }
  }, [user]);

  const handleEraseCache = async () => {
    try {
      await erase.mutateAsync(userId);
      toast.success(t('Users.EraseCacheSuccess', 'User cache erased.'));
      setEraseConfirm(false);
    } catch (err) {
      // API errors are surfaced by the global MutationCache.onError toast.
      logger.error('[UserDetail] Erase cache failed', err);
    }
  };

  const handleToggleStatus = async () => {
    if (!user) return;
    await setUserEnabled.mutateAsync({ userId, enabled: !user.enabled });
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    await updateUser.mutateAsync({ userId, request: editForm });
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    if (user) {
      setEditForm({
        firstName: user.firstName ?? '',
        lastName: user.lastName ?? '',
        email: user.email ?? '',
      });
    }
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div data-slot="user-detail-page" className="space-y-6">
        <div>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/identity/users">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('Users.Detail.BackToUsers')}
            </Link>
          </Button>
        </div>
        <div className="flex flex-col items-center gap-2 py-16 text-center">
          <AlertCircle className="h-8 w-8 text-muted-foreground/70" />
          <p className="text-sm font-medium text-foreground">{t('Users.Detail.NotFound')}</p>
          <p className="text-sm text-muted-foreground">{t('Users.Detail.NotFoundMessage')}</p>
        </div>
      </div>
    );
  }

  return (
    <div data-slot="user-detail-page">
      <DetailAsideLayout
        asideTitle={activityAsideTitle ?? t('Timeline.Title')}
        aside={renderActivityAside?.(userId)}
        header={
          <div className="flex flex-wrap items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/identity/users">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t('Users.Detail.BackToUsers')}
              </Link>
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <div>
              <h2 className="text-2xl font-semibold text-foreground">
                {user.firstName} {user.lastName}
              </h2>
              <p className="text-sm text-muted-foreground font-mono">{user.username}</p>
            </div>
            <Badge
              variant={user.enabled ? 'default' : 'secondary'}
              className={
                user.enabled
                  ? 'border-success-500/25 bg-success-500/15 text-success'
                  : 'bg-accent text-muted-foreground'
              }
            >
              {user.enabled ? t('Users.Status.Enabled') : t('Users.Status.Disabled')}
            </Badge>
            <DetailAsideMobileTrigger className="ml-auto" />
          </div>
        }
      >
        {/* User information */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{t('Users.Modal.UserInfo')}</CardTitle>
            {!isEditing && (
              <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                <Pencil className="mr-2 h-4 w-4" />
                {t('Common.Edit')}
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">{t('Users.Profile.FirstName')}</Label>
                  <Input
                    id="firstName"
                    value={editForm.firstName}
                    onChange={(e) => setEditForm((f) => ({ ...f, firstName: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">{t('Users.Profile.LastName')}</Label>
                  <Input
                    id="lastName"
                    value={editForm.lastName}
                    onChange={(e) => setEditForm((f) => ({ ...f, lastName: e.target.value }))}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="email">{t('Users.Columns.Email')}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                  />
                </div>
                <div className="flex gap-2 sm:col-span-2">
                  <Button size="sm" onClick={handleSaveProfile} disabled={updateUser.isPending}>
                    {updateUser.isPending ? t('Common.Loading') : t('Common.Save')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancelEdit}
                    disabled={updateUser.isPending}
                  >
                    {t('Common.Cancel')}
                  </Button>
                </div>
              </div>
            ) : (
              <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm text-muted-foreground">{t('Users.Columns.Name')}</dt>
                  <dd className="mt-1 font-medium text-foreground">
                    {user.firstName} {user.lastName}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">{t('Users.Columns.Email')}</dt>
                  <dd className="mt-1 text-foreground break-all">{user.email}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">{t('Users.Columns.Username')}</dt>
                  <dd className="mt-1 font-mono text-sm text-foreground">{user.username}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">
                    {t('Users.Columns.PasswordChangedAt')}
                  </dt>
                  <dd className="mt-1 text-foreground">
                    {passwordInfo?.changedAt
                      ? formatTimeAgo(passwordInfo.changedAt)
                      : t('Users.PasswordNeverChanged')}
                  </dd>
                </div>
              </dl>
            )}
          </CardContent>
        </Card>

        {/* Account status */}
        <Card>
          <CardHeader>
            <CardTitle>{t('Users.Modal.AccountStatus')}</CardTitle>
          </CardHeader>
          <CardContent>
            <UserStatusToggle
              enabled={user.enabled}
              onToggle={handleToggleStatus}
              disabled={setUserEnabled.isPending}
            />
          </CardContent>
        </Card>

        {/* Password management */}
        <UserPasswordCard userId={userId} />

        {/* Groups */}
        <UserGroupsEditor userId={userId} />

        {/* Sessions */}
        <UserSessionsCard userId={userId} />

        {/* Device activity */}
        <UserDevicesCard userId={userId} />

        {/* Custom attributes */}
        <UserAttributesCard userId={userId} />

        {/* RGPD — danger zone */}
        {canManageCache && (
          <Card className="border-destructive/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                {t('Users.DangerZone', 'Danger zone')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {eraseConfirm ? (
                <div className="space-y-3 rounded-lg border border-destructive/30 p-4">
                  <p className="text-sm text-muted-foreground">
                    {t(
                      'Users.EraseCacheConfirm',
                      'This will permanently erase all cached identity data for this user. This action cannot be undone.'
                    )}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleEraseCache}
                      disabled={erase.isPending}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      {erase.isPending
                        ? t('Common.Loading')
                        : t('Users.EraseCacheConfirmButton', 'Erase now')}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEraseConfirm(false)}
                      disabled={erase.isPending}
                    >
                      {t('Common.Cancel')}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {t('Users.EraseCacheTitle', 'Erase identity cache')}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {t(
                        'Users.EraseCacheDescription',
                        'Remove all cached data for this user (RGPD Art. 17)'
                      )}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEraseConfirm(true)}
                    className="border-destructive/50 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    {t('Users.EraseCacheButton', 'Erase cache')}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </DetailAsideLayout>
    </div>
  );
}
