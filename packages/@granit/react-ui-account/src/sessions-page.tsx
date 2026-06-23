import { MyDevicesCard } from './components/my-devices-card';
import { MySessionsCard } from './components/my-sessions-card';

interface SessionsPageProps {
  /**
   * Whether the host tracks server-side sessions for this caller. Forwarded to
   * the sessions/devices cards, which hide themselves when it is false. The host
   * computes it (`isBffMode || isMockMode`) — the package stays auth-pattern
   * agnostic. Defaults to `false` (cards hidden).
   */
  readonly sessionTrackingEnabled?: boolean;
}

/** Self-service account page: the caller's own sessions and devices. */
export function SessionsPage({ sessionTrackingEnabled = false }: SessionsPageProps = {}) {
  return (
    <div data-slot="sessions-page" className="space-y-6">
      <MySessionsCard sessionTrackingEnabled={sessionTrackingEnabled} />
      <MyDevicesCard sessionTrackingEnabled={sessionTrackingEnabled} />
    </div>
  );
}
