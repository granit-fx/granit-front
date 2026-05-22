import { useHeartbeat, type UseHeartbeatOptions } from '../hooks/use-heartbeat.js';

export type PresenceHeartbeatProps = UseHeartbeatOptions;

/**
 * Mountable wrapper around {@link useHeartbeat}. Renders nothing.
 *
 * Mount this **exactly once** inside the authenticated shell of the app:
 *
 * ```tsx
 * <PresenceProvider>
 *   <PresenceHeartbeat />
 *   <App />
 * </PresenceProvider>
 * ```
 */
export function PresenceHeartbeat(props: Readonly<PresenceHeartbeatProps>) {
  useHeartbeat(props);
  return null;
}
