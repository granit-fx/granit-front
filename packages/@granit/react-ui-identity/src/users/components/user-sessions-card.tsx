import {
  useTerminateAllSessions,
  useTerminateSession,
  useUserSessions,
} from '@granit/react-identity';

import { SessionsCard } from '../../components/sessions-card';
import { useSessionsCardLabels } from '../../components/use-sessions-card-labels';

import type { UserId } from '@granit/types';

interface UserSessionsCardProps {
  userId: UserId;
}

/**
 * Admin view of another user's active sessions. Same canonical
 * `UserSessionResponse` rows as the self-service card, wired to the
 * permission-gated provider terminate endpoints.
 */
export function UserSessionsCard({ userId }: Readonly<UserSessionsCardProps>) {
  const { data: sessions, isLoading } = useUserSessions(userId);
  const terminateSession = useTerminateSession();
  const terminateAll = useTerminateAllSessions();
  const labels = useSessionsCardLabels('admin');

  return (
    <SessionsCard
      data-slot="user-sessions-card"
      sessions={sessions}
      isLoading={isLoading}
      allowRevokeCurrent
      onRevoke={(sessionId) => terminateSession.mutate({ userId, sessionId })}
      onRevokeAll={() => terminateAll.mutate(userId)}
      isRevoking={terminateSession.isPending}
      isRevokingAll={terminateAll.isPending}
      labels={labels}
    />
  );
}
