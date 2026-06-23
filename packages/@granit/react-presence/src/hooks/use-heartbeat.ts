import { pollMyPresence } from '@granit/presence';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';

import { DEFAULT_HEARTBEAT_INTERVAL_MS } from '../constants';
import { logger } from '../logger';
import { buildPresenceQueryKey, usePresenceConfig } from '../providers/presence-provider';

import { presenceKeys } from './query-keys';

import type { PresenceResponse } from '@granit/presence';

export interface UseHeartbeatOptions {
  /** Polling interval in ms while the tab is visible. Default: 30 000. */
  readonly intervalMs?: number;
  /** Disable the hook entirely. Default: false. */
  readonly disabled?: boolean;
}

const ACTIVITY_EVENTS: readonly (keyof DocumentEventMap)[] = [
  'keydown',
  'mousemove',
  'scroll',
] as const;

/**
 * Sends periodic heartbeats while the tab is visible. Idle seconds are
 * derived from the last `keydown`/`mousemove`/`scroll` event — we never
 * read key/mouse values, just the timestamps.
 *
 * The hook is meant to be mounted **exactly once** at the authenticated
 * shell of the app (see `<PresenceHeartbeat />`). Mounting it multiple
 * times will cause multiple parallel polls.
 */
export function useHeartbeat(options: UseHeartbeatOptions = {}): void {
  const { intervalMs = DEFAULT_HEARTBEAT_INTERVAL_MS, disabled = false } = options;
  const config = usePresenceConfig();
  const queryClient = useQueryClient();

  const lastActivityRef = useRef<number>(Date.now());
  const inFlightRef = useRef(false);

  useEffect(() => {
    if (disabled) return;

    const bumpActivity = () => {
      lastActivityRef.current = Date.now();
    };
    for (const evt of ACTIVITY_EVENTS) {
      document.addEventListener(evt, bumpActivity, { passive: true });
    }
    return () => {
      for (const evt of ACTIVITY_EVENTS) {
        document.removeEventListener(evt, bumpActivity);
      }
    };
  }, [disabled]);

  useEffect(() => {
    if (disabled) return;

    const queryKey = buildPresenceQueryKey(config, ...presenceKeys.my());

    let timer: ReturnType<typeof setInterval> | null = null;
    let cancelled = false;

    const tick = async () => {
      if (cancelled) return;
      if (document.visibilityState !== 'visible') return;
      if (inFlightRef.current) return;
      inFlightRef.current = true;
      try {
        const idleSeconds = Math.max(0, Math.floor((Date.now() - lastActivityRef.current) / 1000));
        const data = await pollMyPresence(config.client, config.basePath, { idleSeconds });
        if (!cancelled) {
          // The poll returns the authoritative snapshot, so it owns the cache.
          // Cancel any in-flight `useMyPresence` GET on the same key first: a
          // concurrent GET resolving after this write would otherwise clobber
          // the cache with a staler snapshot (e.g. Offline, captured before the
          // server registered this heartbeat) and regress the UI until the next
          // tick. This races on initial mount and on every tab re-focus.
          await queryClient.cancelQueries({ queryKey });
          queryClient.setQueryData<PresenceResponse>(queryKey, data);
          logger.debug('Presence heartbeat sent', { idleSeconds });
        }
      } catch {
        // Heartbeat failures are non-critical — keep polling.
        logger.warn('Presence heartbeat poll failed; will retry on next tick');
      } finally {
        inFlightRef.current = false;
      }
    };

    const start = () => {
      if (timer != null) return;
      // Fire one immediately on (re-)start so the UI reflects state quickly.
      void tick();
      timer = setInterval(() => {
        void tick();
      }, intervalMs);
    };

    const stop = () => {
      if (timer != null) {
        clearInterval(timer);
        timer = null;
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        lastActivityRef.current = Date.now();
        start();
      } else {
        stop();
      }
    };

    if (document.visibilityState === 'visible') {
      start();
    }
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      cancelled = true;
      stop();
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [config, disabled, intervalMs, queryClient]);
}
