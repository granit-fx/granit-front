import type { PagedResult } from '@granit/query-engine';
import type { AxiosInstance } from 'axios';

// ---------------------------------------------------------------------------
// Notification types — aligned with Granit.Notifications .NET backend
// ---------------------------------------------------------------------------

export type NotificationSeverity = 'info' | 'success' | 'warning' | 'error';

export interface UserNotification {
  id: string;
  title: string;
  body: string | null;
  severity: NotificationSeverity;
  entityType: string | null;
  entityId: string | null;
  isRead: boolean;
  createdAt: string;
  readAt: string | null;
}

export type UserNotificationPage = PagedResult<UserNotification> & {
  readonly unreadCount: number;
};

// ---------------------------------------------------------------------------
// Activity feed
// ---------------------------------------------------------------------------

export interface ActivityFeedEntry {
  id: string;
  title: string;
  body: string | null;
  severity: NotificationSeverity;
  createdAt: string;
  userId: string | null;
  userDisplayName: string | null;
}

export type ActivityFeedPage = PagedResult<ActivityFeedEntry>;

// ---------------------------------------------------------------------------
// Channels — extensible string type with well-known constants
// ---------------------------------------------------------------------------

/**
 * Notification channel identifier — extensible string type.
 * Consumer apps and backend may define additional channels.
 */
export type NotificationChannel =
  | 'inApp'
  | 'email'
  | 'sms'
  | 'whatsApp'
  | 'push'
  | 'mobilePush'
  | (string & {});

/**
 * Well-known channel identifiers matching the .NET `NotificationChannels` class.
 */
export const NotificationChannels = {
  InApp: 'inApp',
  Email: 'email',
  Sms: 'sms',
  WhatsApp: 'whatsApp',
  Push: 'push',
  MobilePush: 'mobilePush',
  Sse: 'sse',
  SignalR: 'signalR',
  Zulip: 'zulip',
} as const;

// ---------------------------------------------------------------------------
// Preferences
// ---------------------------------------------------------------------------

export interface NotificationPreference {
  notificationType: string;
  label: string;
  channels: Record<string, boolean>;
}

// ---------------------------------------------------------------------------
// Transport abstraction — adapters (SignalR, SSE) implement this interface
// ---------------------------------------------------------------------------

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

/**
 * Real-time notification transport abstraction.
 * Adapters (`@granit/notifications-signalr`, `@granit/notifications-sse`)
 * implement this interface via factory functions.
 *
 * Mirrors the `CookieConsentProvider` pattern from `@granit/cookies`.
 */
export interface NotificationTransport {
  /** Establishes the real-time connection. */
  connect(): Promise<void>;

  /** Gracefully closes the connection. */
  disconnect(): Promise<void>;

  /** Current connection state. */
  readonly state: ConnectionState;

  /**
   * Subscribes to incoming notifications.
   * Returns an unsubscribe function.
   */
  onNotification(callback: (notification: UserNotification) => void): () => void;

  /**
   * Subscribes to connection state changes.
   * Returns an unsubscribe function.
   */
  onStateChange(callback: (state: ConnectionState) => void): () => void;
}

// ---------------------------------------------------------------------------
// Provider config — transport-agnostic
// ---------------------------------------------------------------------------

export interface NotificationConfig {
  apiClient: AxiosInstance;
  basePath?: string;
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

/**
 * Extracts the list of available channels from a preferences response.
 * Useful for dynamically rendering a preferences matrix without hardcoding channels.
 */
export function getAvailableChannels(preferences: readonly NotificationPreference[]): string[] {
  const first = preferences[0];
  if (!first) return [];
  return Object.keys(first.channels);
}
