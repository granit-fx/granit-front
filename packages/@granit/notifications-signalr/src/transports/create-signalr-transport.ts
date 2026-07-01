import { createTransportListeners } from '@granit/notifications';
import { HttpTransportType, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';

import type { NotificationTransportMessage, NotificationTransport } from '@granit/notifications';
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
 * <NotificationsProvider config={{ apiClient }} transport={transport}>
 * ```
 */
export function createSignalRTransport(config: SignalRTransportConfig): NotificationTransport {
  let connection: HubConnection | null = null;
  const listeners = createTransportListeners();
  const setState = listeners.setState;

  return {
    get state() {
      return listeners.state;
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
        listeners.emit(message);
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

    onNotification: listeners.onNotification,
    onStateChange: listeners.onStateChange,
  };
}
