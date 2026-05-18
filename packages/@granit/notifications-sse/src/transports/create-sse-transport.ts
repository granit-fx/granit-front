import { EventStreamContentType, fetchEventSource } from '@microsoft/fetch-event-source';

import type {
  ConnectionState,
  NotificationTransportMessage,
  NotificationTransport,
} from '@granit/notifications';

export interface SseTransportConfig {
  /** SSE endpoint URL, e.g. '/api/v1/notifications/stream'. */
  readonly streamUrl: string;
  /** Returns an access token for authentication. Called on each connection attempt. */
  readonly tokenGetter?: () => Promise<string | null>;
  /** Event type name used for heartbeats. Filtered from notification callbacks. Default: '__heartbeat__'. */
  readonly heartbeatTypeName?: string;
  /**
   * Allow cross-origin `streamUrl`. Default `false` — same-origin only, to
   * prevent leaking the Bearer token to a third party when `streamUrl` is
   * misconfigured. Opt in explicitly when streaming from a separate origin
   * controlled by the same trust boundary.
   */
  readonly allowCrossOrigin?: boolean;
}

function assertStreamUrlOrigin(streamUrl: string, allowCrossOrigin: boolean): void {
  if (allowCrossOrigin) return;
  if (globalThis.location === undefined) return;
  let resolved: URL;
  try {
    resolved = new URL(streamUrl, globalThis.location.href);
  } catch {
    throw new TypeError(`[@granit/notifications-sse] Invalid streamUrl: "${streamUrl}"`);
  }
  if (resolved.origin !== globalThis.location.origin) {
    throw new Error(
      `[@granit/notifications-sse] Refusing cross-origin stream to ${resolved.origin}. ` +
        `Set \`allowCrossOrigin: true\` to opt in if the target origin shares your trust boundary.`
    );
  }
}

class RetriableError extends Error {}
class FatalError extends Error {}

/**
 * Creates a `NotificationTransport` backed by Server-Sent Events (SSE).
 *
 * Uses `@microsoft/fetch-event-source` for automatic reconnection and
 * auth header injection on each reconnect.
 *
 * @example
 * ```ts
 * const transport = createSseTransport({
 *   streamUrl: '/api/v1/notifications/stream',
 *   tokenGetter: () => keycloak.token,
 * });
 *
 * <NotificationProvider config={{ apiClient }} transport={transport}>
 * ```
 */
export function createSseTransport(config: SseTransportConfig): NotificationTransport {
  assertStreamUrlOrigin(config.streamUrl, config.allowCrossOrigin === true);
  const heartbeatType = config.heartbeatTypeName ?? '__heartbeat__';
  let abortController: AbortController | null = null;
  let currentState: ConnectionState = 'disconnected';
  const notificationListeners = new Set<(message: NotificationTransportMessage) => void>();
  const stateListeners = new Set<(state: ConnectionState) => void>();

  function setState(state: ConnectionState) {
    currentState = state;
    for (const listener of stateListeners) {
      listener(state);
    }
  }

  return {
    get state() {
      return currentState;
    },

    async connect() {
      abortController = new AbortController();

      await fetchEventSource(config.streamUrl, {
        signal: abortController.signal,

        async onopen(response) {
          const contentType = response.headers.get('content-type') ?? '';
          if (response.ok && contentType.includes(EventStreamContentType)) {
            setState('connected');
            return;
          }
          if (response.status >= 400 && response.status < 500 && response.status !== 429) {
            throw new FatalError(`SSE connection failed: ${response.status}`);
          }
          throw new RetriableError(`SSE connection failed: ${response.status}`);
        },

        onmessage(event) {
          if (event.event === heartbeatType || !event.data) return;

          try {
            const message = JSON.parse(event.data) as NotificationTransportMessage;
            for (const listener of notificationListeners) {
              listener(message);
            }
          } catch {
            // Malformed events are silently skipped.
          }
        },

        onclose() {
          setState('disconnected');
        },

        onerror(err) {
          if (err instanceof FatalError) {
            setState('disconnected');
            throw err;
          }
          setState('reconnecting');
        },

        fetch: config.tokenGetter
          ? async (input, init) => {
              const token = await config.tokenGetter!();
              const headers = new Headers(init?.headers);
              if (token) {
                headers.set('Authorization', `Bearer ${token}`);
              }
              return fetch(input, { ...init, headers });
            }
          : undefined,

        openWhenHidden: true,
      });
    },

    async disconnect() {
      if (abortController) {
        abortController.abort();
        abortController = null;
      }
      setState('disconnected');
    },

    onNotification(callback) {
      notificationListeners.add(callback);
      return () => {
        notificationListeners.delete(callback);
      };
    },

    onStateChange(callback) {
      stateListeners.add(callback);
      return () => {
        stateListeners.delete(callback);
      };
    },
  };
}
