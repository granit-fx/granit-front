import type { PagedResult } from '@granit/query-engine';
import type { ISODateString } from '@granit/types';
import type { AxiosInstance } from 'axios';

// ---------------------------------------------------------------------------
// Notification types — aligned with Granit.Notifications .NET backend
// ---------------------------------------------------------------------------

export type NotificationSeverity = 'Info' | 'Success' | 'Warning' | 'Error' | 'Fatal';

/**
 * Matches `UserNotificationState` enum from .NET backend.
 */
export type UserNotificationState = 'Unread' | 'Read';

export interface UserNotification {
  readonly id: string;
  readonly notificationId: string;
  readonly notificationTypeName: string;
  readonly severity: NotificationSeverity;
  readonly data: unknown;
  readonly recipientUserId: string;
  readonly relatedEntityType: string | null;
  readonly relatedEntityId: string | null;
  readonly state: UserNotificationState;
  readonly createdAt: ISODateString;
  readonly readAt: ISODateString | null;
}

export type UserNotificationPage = PagedResult<UserNotification> & {
  readonly unreadCount: number;
};

// ---------------------------------------------------------------------------
// Real-time transport message — shape received via SignalR/SSE
// ---------------------------------------------------------------------------

/**
 * Message shape pushed by the backend over real-time transports (SignalR, SSE).
 * This is distinct from `UserNotification` which is the REST API response shape.
 */
export interface NotificationTransportMessage {
  readonly notificationId: string;
  readonly notificationTypeName: string;
  readonly severity: NotificationSeverity;
  readonly data: unknown;
  readonly relatedEntityType: string | null;
  readonly relatedEntityId: string | null;
  readonly occurredAt: ISODateString;
}

// ---------------------------------------------------------------------------
// Activity feed
// ---------------------------------------------------------------------------

export interface ActivityFeedEntry {
  id: string;
  title: string;
  body: string | null;
  severity: NotificationSeverity;
  createdAt: ISODateString;
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
  | 'InApp'
  | 'Email'
  | 'Sms'
  | 'WhatsApp'
  | 'Push'
  | 'MobilePush'
  | (string & {});

/**
 * Well-known channel identifiers matching the .NET `NotificationChannels` class.
 * Values are PascalCase strings matching the backend serialization.
 */
export const NotificationChannels = {
  InApp: 'InApp',
  Email: 'Email',
  Sms: 'Sms',
  WhatsApp: 'WhatsApp',
  Push: 'Push',
  MobilePush: 'MobilePush',
  Sse: 'Sse',
  SignalR: 'SignalR',
  Zulip: 'Zulip',
} as const;

// ---------------------------------------------------------------------------
// Preferences — flat row matching NotificationPreferenceResponse from .NET
// ---------------------------------------------------------------------------

export interface NotificationPreference {
  readonly id: string;
  readonly userId: string;
  readonly notificationTypeName: string;
  readonly channelName: string;
  readonly isEnabled: boolean;
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
   * Subscribes to incoming real-time notifications.
   * Returns an unsubscribe function.
   */
  onNotification(callback: (message: NotificationTransportMessage) => void): () => void;

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
