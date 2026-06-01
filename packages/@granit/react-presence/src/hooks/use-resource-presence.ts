import { joinResourceRoom, leaveResourceRoom } from '@granit/presence';
import { useCallback, useEffect, useRef, useState } from 'react';

import {
  DEFAULT_RESOURCE_HEARTBEAT_INTERVAL_MS,
  DEFAULT_RESOURCE_STALE_THRESHOLD_MS,
} from '../constants';
import { usePresenceConfig } from '../providers/presence-provider';

import type { ResourcePresenceParticipantResponse, ResourceRoomResponse } from '@granit/presence';

export interface UseResourcePresenceOptions {
  /** Heartbeat cadence ms. Default: 15 000. */
  readonly heartbeatIntervalMs?: number;
  /**
   * Local stale filter ms. Default: 45 000.
   * Drops participants whose `lastSeenUtc` is older than this threshold.
   */
  readonly staleThresholdMs?: number;
  /**
   * Metadata to include in each heartbeat body (≤ 512 bytes UTF-8).
   * Changes are picked up on the next tick — no immediate extra request.
   */
  readonly metadata?: string | null;
  /**
   * When `false`, the hook is inert: no join, no heartbeat, no leave.
   * Default: `true`.
   */
  readonly enabled?: boolean;
}

export interface UseResourcePresenceResult {
  /** Current participants, stale entries removed, sorted freshest-first. */
  readonly participants: ResourcePresenceParticipantResponse[];
  /** `true` until the first successful heartbeat response. */
  readonly isJoining: boolean;
  /** Last error from a heartbeat attempt (cleared on next success). */
  readonly error: Error | null;
  /**
   * Optimistic leave — fires DELETE immediately (e.g. before navigating away).
   * The hook also fires DELETE automatically on unmount.
   */
  readonly leave: () => Promise<void>;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

const MAX_RETRIES = 3;
const BASE_RETRY_DELAY_MS = 1_000;
const MAX_RETRY_DELAY_MS = 10_000;

async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number,
  signal: AbortSignal
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (signal.aborted) throw new DOMException('The operation was aborted.', 'AbortError');
    try {
      return await fn();
    } catch (err) {
      if (signal.aborted) throw err;
      // Don't retry validation errors — they are deterministic.
      if (err instanceof TypeError) throw err;
      lastError = err;
      if (attempt < maxRetries) {
        const delay = Math.min(BASE_RETRY_DELAY_MS * 2 ** attempt, MAX_RETRY_DELAY_MS);
        await new Promise<void>((resolve) => {
          const id = setTimeout(resolve, delay);
          signal.addEventListener(
            'abort',
            () => {
              clearTimeout(id);
              resolve();
            },
            { once: true }
          );
        });
      }
    }
  }
  throw lastError;
}

function applyStaleFilter(
  data: ResourceRoomResponse,
  staleThresholdMs: number
): ResourcePresenceParticipantResponse[] {
  const now = Date.now();
  return data.participants
    .filter((p) => now - new Date(p.lastSeenUtc).getTime() <= staleThresholdMs)
    .sort((a, b) => new Date(b.lastSeenUtc).getTime() - new Date(a.lastSeenUtc).getTime());
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Joins a resource-scoped presence room and maintains a live participant list.
 *
 * On mount the hook sends an immediate heartbeat (join). While the tab is
 * visible it re-heartbeats every `heartbeatIntervalMs`. When the tab is
 * hidden heartbeats are paused to avoid wasted requests. On unmount the hook
 * fires a best-effort DELETE leave.
 *
 * Requires `Presence.Rooms.Join` (POST/DELETE). `kind` and `id` changes cause
 * an atomic leave-old + join-new transition.
 */
export function useResourcePresence(
  kind: string,
  id: string,
  options: UseResourcePresenceOptions = {}
): UseResourcePresenceResult {
  const {
    heartbeatIntervalMs = DEFAULT_RESOURCE_HEARTBEAT_INTERVAL_MS,
    staleThresholdMs = DEFAULT_RESOURCE_STALE_THRESHOLD_MS,
    metadata = null,
    enabled = true,
  } = options;

  const config = usePresenceConfig();
  const [participants, setParticipants] = useState<ResourcePresenceParticipantResponse[]>([]);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Kept in refs so changes don't restart the heartbeat cycle.
  const metadataRef = useRef(metadata);
  const staleThresholdRef = useRef(staleThresholdMs);
  useEffect(() => {
    metadataRef.current = metadata ?? null;
  });
  useEffect(() => {
    staleThresholdRef.current = staleThresholdMs;
  });

  useEffect(() => {
    if (!enabled) {
      setParticipants([]);
      setIsJoining(false);
      setError(null);
      return;
    }

    // Validate deterministic inputs before any network activity.
    // metadata is validated per-tick inside joinResourceRoom.
    const kindError = !/^[a-z][a-z0-9_.-]{0,63}$/.test(kind)
      ? new TypeError(
          `Invalid resource presence kind "${kind}". Must match /^[a-z][a-z0-9_.-]{0,63}$/`
        )
      : null;
    const idError =
      id.length > 256 ? new TypeError(`Resource presence id must be ≤ 256 characters`) : null;
    const validationError = kindError ?? idError;
    if (validationError) {
      setError(validationError);
      setIsJoining(false);
      return;
    }

    const ac = new AbortController();
    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | null = null;
    let inFlight = false;

    setIsJoining(true);
    setError(null);

    const tick = async () => {
      if (cancelled || document.visibilityState !== 'visible' || inFlight) return;
      inFlight = true;
      try {
        const body = metadataRef.current != null ? { metadata: metadataRef.current } : {};
        const data = await retryWithBackoff(
          () => joinResourceRoom(config.client, config.basePath, kind, id, body, ac.signal),
          MAX_RETRIES,
          ac.signal
        );
        if (!cancelled) {
          setParticipants(applyStaleFilter(data, staleThresholdRef.current));
          setIsJoining(false);
          setError(null);
        }
      } catch (err) {
        if (!cancelled && !ac.signal.aborted) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setIsJoining(false);
        }
      } finally {
        inFlight = false;
      }
    };

    const stopTimer = () => {
      if (timer !== null) {
        clearInterval(timer);
        timer = null;
      }
    };

    const startTimer = () => {
      if (timer !== null) return;
      void tick();
      timer = setInterval(() => {
        void tick();
      }, heartbeatIntervalMs);
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        startTimer();
      } else {
        stopTimer();
      }
    };

    if (document.visibilityState === 'visible') {
      startTimer();
    }
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      cancelled = true;
      ac.abort();
      stopTimer();
      document.removeEventListener('visibilitychange', onVisibilityChange);
      // Best-effort leave — no retry, no await (component may already be destroyed).
      void leaveResourceRoom(config.client, config.basePath, kind, id).catch(() => {});
    };
  }, [config, enabled, heartbeatIntervalMs, id, kind]);

  const leave = useCallback(async () => {
    if (!enabled) return;
    await leaveResourceRoom(config.client, config.basePath, kind, id);
  }, [config, enabled, id, kind]);

  return { participants, isJoining, error, leave };
}
