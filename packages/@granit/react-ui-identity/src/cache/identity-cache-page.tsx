import {
  useIdentityCapabilities,
  useIdentityCacheStats,
  useIdentitySync,
  useIdentityUsers,
} from '@granit/react-identity';
import { useDateFormatter, useTranslation } from '@granit/react-localization';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Spinner,
} from '@granit/react-ui';
import { toEntityId } from '@granit/types';
import { DatabaseZap, RefreshCw, Search, Users } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { logger } from '../logger';

import type { UserId } from '@granit/types';

function StatCard({
  label,
  value,
  subtitle,
}: {
  readonly label: string;
  readonly value: string | number | undefined;
  readonly subtitle?: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-semibold text-foreground">
          {value ?? <span className="text-muted-foreground/50">—</span>}
        </p>
        {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}

function toggleSelection(prev: string[], userId: string): string[] {
  return prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId];
}

export function IdentityCachePage() {
  const { t } = useTranslation();
  const { formatDateTime } = useDateFormatter();
  const { data: capabilities } = useIdentityCapabilities();
  const { data: stats, isLoading: statsLoading } = useIdentityCacheStats();
  const { sync, syncAll, syncStale } = useIdentitySync();
  const [userSearch, setUserSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const { data: usersPage, isLoading: usersLoading } = useIdentityUsers(
    userSearch ? { search: userSearch } : undefined
  );

  function toggleUser(userId: string) {
    setSelectedIds((prev) => toggleSelection(prev, userId));
  }

  async function handleSyncSelected() {
    if (selectedIds.length === 0) return;
    try {
      await sync.mutateAsync(selectedIds.map((id) => toEntityId<'User'>(id) as UserId));
      toast.success(
        t('Identity.Cache.SyncSelectedSuccess', `Synced ${selectedIds.length} user(s).`)
      );
      setSelectedIds([]);
    } catch (err) {
      // API errors are surfaced by the global MutationCache.onError toast.
      logger.error('[IdentityCache] Sync selected failed', err);
    }
  }

  async function handleSyncAll() {
    try {
      const result = await syncAll.mutateAsync();
      toast.success(
        t('Identity.Cache.SyncAllSuccess', `Synced all users (${result.syncedCount} entries).`)
      );
    } catch (err) {
      // API errors are surfaced by the global MutationCache.onError toast.
      logger.error('[IdentityCache] Sync all failed', err);
    }
  }

  async function handleSyncStale() {
    try {
      const result = await syncStale.mutateAsync();
      toast.success(
        t('Identity.Cache.SyncStaleSuccess', `Refreshed ${result.refreshedCount} stale entries.`)
      );
    } catch (err) {
      // API errors are surfaced by the global MutationCache.onError toast.
      logger.error('[IdentityCache] Sync stale failed', err);
    }
  }

  const isSyncing = sync.isPending || syncAll.isPending || syncStale.isPending;

  function renderUserList() {
    if (usersLoading) {
      return (
        <div className="flex h-24 items-center justify-center">
          <Spinner />
        </div>
      );
    }
    if (usersPage && usersPage.items.length > 0) {
      return (
        <div className="divide-y divide-border rounded-lg border border-border">
          {usersPage.items.map((user) => (
            <label
              key={user.userId}
              className="flex cursor-pointer items-center gap-3 px-4 py-3 hover:bg-muted/50"
            >
              <input
                type="checkbox"
                checked={selectedIds.includes(user.userId)}
                onChange={() => toggleUser(user.userId)}
                className="h-4 w-4 rounded border-border"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {user.firstName || user.lastName
                    ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim()
                    : user.username}
                </p>
                <p className="truncate text-xs text-muted-foreground">{user.email}</p>
              </div>
              <Badge variant={user.enabled ? 'default' : 'secondary'} className="shrink-0">
                {user.enabled ? t('Users.Status.Enabled') : t('Users.Status.Disabled')}
              </Badge>
            </label>
          ))}
        </div>
      );
    }
    if (userSearch) {
      return (
        <p className="py-4 text-center text-sm text-muted-foreground">
          {t('Common.NoResults', 'No results found.')}
        </p>
      );
    }
    return null;
  }

  return (
    <div data-slot="identity-cache-page" className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">
            {t('Identity.Cache.Title', 'Identity cache')}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t(
              'Identity.Cache.Subtitle',
              'Manage the identity user cache and sync with the provider'
            )}
          </p>
        </div>
        {capabilities && (
          <Badge variant="secondary" className="gap-1.5">
            <DatabaseZap className="h-3.5 w-3.5" />
            {capabilities.providerName ?? t('Identity.Cache.UnknownProvider', 'Unknown provider')}
          </Badge>
        )}
      </div>

      {/* Cache statistics */}
      {statsLoading ? (
        <div className="flex h-32 items-center justify-center">
          <Spinner />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label={t('Identity.Cache.TotalEntries', 'Total entries')}
            value={stats?.totalEntries}
          />
          <StatCard
            label={t('Identity.Cache.StaleEntries', 'Stale entries')}
            value={stats?.staleEntries}
          />
          <StatCard
            label={t('Identity.Cache.OldestSync', 'Oldest sync')}
            value={stats?.oldestSyncAt ? formatDateTime(stats.oldestSyncAt) : '—'}
          />
          <StatCard
            label={t('Identity.Cache.NewestSync', 'Newest sync')}
            value={stats?.newestSyncAt ? formatDateTime(stats.newestSyncAt) : '—'}
          />
        </div>
      )}

      {/* Sync actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            {t('Identity.Cache.SyncTitle', 'Synchronize cache')}
          </CardTitle>
          <CardDescription>
            {t(
              'Identity.Cache.SyncDescription',
              'Pull the latest data from the identity provider into the local cache'
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button onClick={handleSyncAll} disabled={isSyncing} variant="default">
            {syncAll.isPending ? (
              <>
                <Spinner size="sm" className="mr-2" />
                {t('Common.Loading')}
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                {t('Identity.Cache.SyncAll', 'Sync all')}
              </>
            )}
          </Button>
          <Button onClick={handleSyncStale} disabled={isSyncing} variant="outline">
            {syncStale.isPending ? (
              <>
                <Spinner size="sm" className="mr-2" />
                {t('Common.Loading')}
              </>
            ) : (
              t('Identity.Cache.SyncStale', 'Sync stale')
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Selective sync */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {t('Identity.Cache.SelectiveSyncTitle', 'Sync selected users')}
          </CardTitle>
          <CardDescription>
            {t(
              'Identity.Cache.SelectiveSyncDescription',
              'Search cached users and sync specific entries'
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t('Common.SearchPlaceholder')}
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {renderUserList()}

          {selectedIds.length > 0 && (
            <Button onClick={handleSyncSelected} disabled={isSyncing}>
              {sync.isPending ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  {t('Common.Loading')}
                </>
              ) : (
                t('Identity.Cache.SyncSelected', `Sync ${selectedIds.length} selected`)
              )}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
