import { PRESENCE_DEFAULTS } from '@granit/presence';
import { useProviderUsers } from '@granit/react-identity';
import { useDateFormatter, useTranslation } from '@granit/react-localization';
import {
  DndBanner,
  PresenceDot,
  PresencePicker,
  useBatchPresence,
  useClearMyPresenceOverride,
  useMyPresence,
  useResourcePresence,
} from '@granit/react-presence';
import {
  Alert,
  AlertDescription,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@granit/react-ui';
import { useMemo } from 'react';

import type { IdentityUser } from '@granit/identity';
import type { UserId } from '@granit/types';

const MAX_TEAM_USERS = 4;
const DEMO_ROOM_KIND = 'showcase.demo';
const DEMO_ROOM_ID = 'room-1';

function displayName(user: IdentityUser): string {
  const full = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  return full || user.username || user.email || user.userId;
}

function displayParticipantName(
  userId: string,
  myUserId: string | undefined,
  teamUsers: readonly IdentityUser[],
  t: (key: string) => string
): string {
  if (userId === myUserId) return t('Presence.RoomSelf');
  const user = teamUsers.find((u) => u.userId === userId);
  if (user) return displayName(user);
  return `${userId.slice(0, 8)}…`;
}

export function PresenceDemoPage() {
  const { t } = useTranslation();
  const { formatDateTime } = useDateFormatter();
  const my = useMyPresence();
  const clearOverride = useClearMyPresenceOverride();

  const usersQuery = useProviderUsers({ max: MAX_TEAM_USERS + 1 });

  const myUserId = my.data?.userId;
  const teamUsers = useMemo<readonly IdentityUser[]>(() => {
    const all = usersQuery.data ?? [];
    const filtered = myUserId ? all.filter((u) => u.userId !== myUserId) : all;
    return filtered.slice(0, MAX_TEAM_USERS);
  }, [usersQuery.data, myUserId]);

  const teamUserIds = useMemo<UserId[]>(() => teamUsers.map((u) => u.userId), [teamUsers]);

  const others = useBatchPresence(teamUserIds, { enabled: teamUserIds.length > 0 });
  const room = useResourcePresence(DEMO_ROOM_KIND, DEMO_ROOM_ID);

  const lastSeenLabel = my.data?.lastSeenUtc
    ? t('Presence.LastSeen', { when: formatDateTime(my.data.lastSeenUtc) })
    : t('Presence.LastSeenUnknown');

  return (
    <div className="space-y-6" data-slot="presence-demo-page">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">{t('Presence.Title')}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t('Presence.Subtitle')}</p>
      </div>

      <DndBanner presence={my.data ?? null} onClear={() => clearOverride.mutate()} />

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('Presence.YourPresence')}</CardTitle>
          </CardHeader>
          <CardContent>
            {my.isPending && (
              <p className="text-sm text-muted-foreground">{t('Presence.Loading')}</p>
            )}
            {my.error && (
              <Alert variant="destructive">
                <AlertDescription>
                  {t('Presence.LoadFailed', { error: my.error.message })}
                </AlertDescription>
              </Alert>
            )}
            {my.data && (
              <dl className="space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  <PresenceDot status={my.data.effectiveStatus} />
                  <span>
                    <strong>{my.data.effectiveStatus}</strong>
                    {my.data.manualOverride ? (
                      <> {t('Presence.OverrideLabel', { status: my.data.manualOverride })}</>
                    ) : null}
                  </span>
                </div>
                <div className="text-muted-foreground">{lastSeenLabel}</div>
                <div className="text-muted-foreground">
                  {t('Presence.HeartbeatCadence', {
                    seconds: PRESENCE_DEFAULTS.OfflineThresholdSeconds,
                  })}
                </div>
              </dl>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('Presence.SetStatus')}</CardTitle>
          </CardHeader>
          <CardContent>
            <PresencePicker />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('Presence.TeamPresence')}</CardTitle>
        </CardHeader>
        <CardContent>
          {usersQuery.isPending && (
            <p className="text-sm text-muted-foreground">{t('Presence.TeamLoading')}</p>
          )}
          {usersQuery.error && (
            <Alert variant="destructive">
              <AlertDescription>
                {t('Presence.LoadFailed', { error: usersQuery.error.message })}
              </AlertDescription>
            </Alert>
          )}
          {!usersQuery.isPending && !usersQuery.error && teamUsers.length === 0 && (
            <p className="text-sm text-muted-foreground">{t('Presence.TeamEmpty')}</p>
          )}
          {teamUsers.length > 0 && (
            <ul className="space-y-2">
              {teamUsers.map((u) => {
                const snapshot = others.data?.presences[u.userId];
                const status = snapshot?.effectiveStatus ?? 'Offline';
                return (
                  <li key={u.userId} className="flex items-center gap-3 text-sm">
                    <PresenceDot status={status} />
                    <span className="font-medium">{displayName(u)}</span>
                    <span className="text-muted-foreground">{status}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card data-slot="presence-room-card">
        <CardHeader>
          <CardTitle>{t('Presence.RoomTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          {room.isJoining && (
            <p className="text-sm text-muted-foreground">{t('Presence.RoomJoining')}</p>
          )}
          {room.error && (
            <Alert variant="destructive">
              <AlertDescription>
                {t('Presence.RoomError', { error: room.error.message })}
              </AlertDescription>
            </Alert>
          )}
          {!room.isJoining && !room.error && room.participants.length === 0 && (
            <p className="text-sm text-muted-foreground">{t('Presence.RoomEmpty')}</p>
          )}
          {room.participants.length > 0 && (
            <ul className="space-y-2">
              {room.participants.map((p) => (
                <li key={p.userId} className="flex items-center gap-3 text-sm">
                  <PresenceDot status="Online" />
                  <span className="font-medium">
                    {displayParticipantName(p.userId, myUserId, teamUsers, t)}
                  </span>
                  <span className="text-muted-foreground">
                    {t('Presence.RoomLastSeen', { when: formatDateTime(p.lastSeenUtc) })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
