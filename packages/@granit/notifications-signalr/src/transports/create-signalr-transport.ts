import { HttpTransportType, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';

import type {
  ConnectionState,
  NotificationTransportMessage,
  NotificationTransport,
} from '@granit/notifications';
import type { HubConnection } from '@microsoft/signalr';

export interface SignalRTransportConfig {
  /** SignalR hub URL, e.g. '/hubs/notifications'. */
  readonly hubUrl: string;
  /** Returns an access token for authentication. Called on each connection attempt. */
  readonly tokenGetter?: () => Promise<string | null>;
}

/**
 * Creates a `NotificationTransport` backed by SignalR.
 *
 * @example
 * ```ts
 * const transport = createSignalRTransport({
 *   hubUrl: '/hubs/notifications',
 *   tokenGetter: () => keycloak.token,
 * });
 *
 * <NotificationProvider config={{ apiClient }} transport={transport}>
 * ```
 */
export function createSignalRTransport(config: SignalRTransportConfig): NotificationTransport {
  let connection: HubConnection | null = null;
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
      connection = new HubConnectionBuilder()
        .withUrl(config.hubUrl, {
          transport: HttpTransportType.WebSockets | HttpTransportType.LongPolling,
          accessTokenFactory: config.tokenGetter
            ? async () => (await config.tokenGetter!()) ?? ''
            : undefined,
        })
        .withAutomaticReconnect()
        .configureLogging(LogLevel.Warning)
        .build();

      connection.on('ReceiveNotification', (message: NotificationTransportMessage) => {
        for (const listener of notificationListeners) {
          listener(message);
        }
      });

      connection.onreconnecting(() => setState('reconnecting'));
      connection.onreconnected(() => setState('connected'));
      connection.onclose(() => setState('disconnected'));

      await connection.start();
    },

    async disconnect() {
      if (connection) {
        await connection.stop();
        connection = null;
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
