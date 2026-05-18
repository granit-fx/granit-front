import type { AxiosInstance } from '@granit/api-client';
import type { PagedResult } from '@granit/query-engine';
import type { EntityId, ISODateString, UserId } from '@granit/types';

// ---------------------------------------------------------------------------
// Notification types — aligned with Granit.Notifications .NET backend
// ---------------------------------------------------------------------------

export type NotificationSeverity = 'Info' | 'Success' | 'Warning' | 'Error' | 'Fatal';

/**
 * Matches `UserNotificationState` enum from .NET backend.
 */
export type UserNotificationState = 'Unread' | 'Read';

/** Branded user notification identifier. */
export type UserNotificationId = EntityId<'UserNotification'>;

/** Branded notification identifier. */
export type NotificationId = EntityId<'Notification'>;

export interface UserNotification {
  readonly id: UserNotificationId;
  readonly notificationId: NotificationId;
  readonly notificationTypeName: string;
  readonly severity: NotificationSeverity;
  readonly data: unknown;
  readonly recipientUserId: UserId;
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
  readonly notificationId: NotificationId;
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

/** Branded activity feed entry identifier. */
export type ActivityFeedEntryId = EntityId<'ActivityFeedEntry'>;

export interface ActivityFeedEntry {
  id: ActivityFeedEntryId;
  title: string;
  body: string | null;
  severity: NotificationSeverity;
  createdAt: ISODateString;
  userId: UserId | null;
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

/** Branded notification preference identifier. */
export type NotificationPreferenceId = EntityId<'NotificationPreference'>;

export interface NotificationPreference {
  readonly id: NotificationPreferenceId;
  readonly userId: UserId;
  readonly notificationTypeName: string;
  readonly channelName: string;
  readonly isEnabled: boolean;
}

// ---------------------------------------------------------------------------
// Notification type definitions — mirrors NotificationDefinition .NET
// ---------------------------------------------------------------------------

/**
 * Metadata for a notification type, returned by `GET /types`. Mirrors
 * `Granit.Notifications.NotificationDefinition`.
 */
export interface NotificationDefinition {
  readonly name: string;
  readonly defaultSeverity: NotificationSeverity;
  readonly defaultChannels: readonly string[];
  readonly displayName: string | null;
  readonly description: string | null;
  readonly groupName: string | null;
  /**
   * When `false`, the notification is always sent regardless of user
   * preferences (e.g. security alerts, GDPR breach notifications).
   */
  readonly allowUserOptOut: boolean;
}

// ---------------------------------------------------------------------------
// Subscriptions and entity followers — mirrors NotificationSubscriptionResponse
// ---------------------------------------------------------------------------

/** Branded notification subscription identifier. */
export type NotificationSubscriptionId = EntityId<'NotificationSubscription'>;

/**
 * A notification subscription or entity-follower entry. Mirrors
 * `Granit.Notifications.Endpoints.Dtos.NotificationSubscriptionResponse`.
 */
export interface NotificationSubscriptionResponse {
  readonly id: NotificationSubscriptionId;
  readonly userId: UserId;
  readonly notificationTypeName: string;
  /** Entity type for follower subscriptions (null for type-level subscriptions). */
  readonly entityType: string | null;
  /** Entity id for follower subscriptions (null for type-level subscriptions). */
  readonly entityId: string | null;
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
