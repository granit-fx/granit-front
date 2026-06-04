import type { ConnectionState, NotificationTransportMessage } from './types/index';

/**
 * Shared listener bookkeeping for {@link NotificationTransport} implementations.
 *
 * Holds the current connection state plus the notification/state listener sets,
 * and exposes the `onNotification`/`onStateChange` subscribe methods that every
 * transport implements identically. Transport adapters
 * (`@granit/notifications-signalr`, `@granit/notifications-sse`) own the
 * connection lifecycle and delegate listener management here.
 */
export interface TransportListeners {
  /** Current connection state. */
  readonly state: ConnectionState;
  /** Updates the state and notifies every state listener. */
  setState(state: ConnectionState): void;
  /** Dispatches an incoming message to every notification listener. */
  emit(message: NotificationTransportMessage): void;
  /** Subscribes to incoming real-time notifications. Returns an unsubscribe function. */
  onNotification(callback: (message: NotificationTransportMessage) => void): () => void;
  /** Subscribes to connection state changes. Returns an unsubscribe function. */
  onStateChange(callback: (state: ConnectionState) => void): () => void;
}

/**
 * Creates the listener registry shared by every `NotificationTransport`.
 *
 * @param initialState - Connection state before the first `connect()`. Default `'disconnected'`.
 */
export function createTransportListeners(
  initialState: ConnectionState = 'disconnected'
): TransportListeners {
  let currentState: ConnectionState = initialState;
  const notificationListeners = new Set<(message: NotificationTransportMessage) => void>();
  const stateListeners = new Set<(state: ConnectionState) => void>();

  return {
    get state() {
      return currentState;
    },

    setState(state) {
      currentState = state;
      for (const listener of stateListeners) {
        listener(state);
      }
    },

    emit(message) {
      for (const listener of notificationListeners) {
        listener(message);
      }
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
