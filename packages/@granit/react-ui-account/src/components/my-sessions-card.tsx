import {
  useMyUserSessions,
  useRevokeMyOtherUserSessions,
  useRevokeMyUserSession,
} from '@granit/react-identity';
import { SessionsCard, useSessionsCardLabels } from '@granit/react-ui-identity';

interface MySessionsCardProps {
  /**
   * Whether the host tracks server-side sessions for this caller. Session
   * listing/revocation only works behind a cookie/BFF (or mock) session, so the
   * host computes this (`isBffMode || isMockMode`) and the card hides itself
   * when it is false — the package stays auth-pattern-agnostic.
   */
  readonly sessionTrackingEnabled: boolean;
}

/**
 * The caller's own active sessions. Backed by the canonical `/sessions`
 * endpoints (granit-dotnet #2692) via `@granit/react-identity` — the BFF no
 * longer owns session listing/revocation.
 */
export function MySessionsCard({ sessionTrackingEnabled }: MySessionsCardProps) {
  if (!sessionTrackingEnabled) return null;
  return <MySessionsCardContent />;
}

function MySessionsCardContent() {
  const { data: sessions, isLoading } = useMyUserSessions();
  const revoke = useRevokeMyUserSession();
  const revokeOthers = useRevokeMyOtherUserSessions();
  const labels = useSessionsCardLabels('self');

  return (
    <SessionsCard
      data-slot="my-sessions-card"
      sessions={sessions}
      isLoading={isLoading}
      onRevoke={(sessionId) => revoke.mutate(sessionId)}
      onRevokeAll={() => revokeOthers.mutate()}
      isRevoking={revoke.isPending}
      isRevokingAll={revokeOthers.isPending}
      labels={labels}
    />
  );
}
