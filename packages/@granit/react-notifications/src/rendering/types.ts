import type { NotificationSeverity, UserNotification } from '@granit/notifications';
import type { ComponentType } from 'react';

/**
 * Translate function shape the rendering layer relies on. Kept structural
 * (rather than importing i18next's `TFunction`) so views and the consuming app
 * stay decoupled from the i18n backend.
 */
export type TranslateFn = (
  key: string,
  options?: Record<string, unknown> & { defaultValue?: string }
) => string;

/** A click-through link produced by a notification view. */
export interface NotificationActionLink {
  readonly label: string;
  /**
   * Where the action points. Resolution is the host's concern: relative paths
   * are typically routed in-app, absolute (`http(s)://`) URLs opened externally.
   * Internal routes should be derived by the view from the notification's
   * semantic fields — the backend never emits frontend routes.
   */
  readonly to: string;
}

/**
 * Normalized rendering descriptor for a single notification. A view turns the
 * raw `data` payload into this shape; the host renders the chrome uniformly so
 * every notification respects the design system.
 */
export interface NotificationPresentation {
  readonly title: string;
  readonly body?: string;
  readonly icon?: ComponentType<{ className?: string }>;
  readonly iconClassName?: string;
  /** Overrides the severity badge; defaults to the notification's own severity. */
  readonly severity?: NotificationSeverity;
  /** Extra outline badge (e.g. a notification subtype). */
  readonly typeBadge?: string;
  readonly action?: NotificationActionLink;
}

/**
 * Subset of notification fields a view may rely on — the intersection of the
 * REST shape (`UserNotification`) and the SSE transport shape, so the same view
 * works for both live and persisted notifications.
 */
export type PresentableNotification = Pick<
  UserNotification,
  'notificationTypeName' | 'severity' | 'data' | 'relatedEntityType' | 'relatedEntityId'
>;

/** Ambient context handed to every view at render time. */
export interface NotificationPresentContext {
  readonly t: TranslateFn;
}

/**
 * A registered renderer for one notification type, keyed by
 * `notificationTypeName` (the backend-emitted "code").
 */
export interface NotificationView<TData = unknown> {
  /** Matches `UserNotification.notificationTypeName`. */
  readonly code: string;
  /** Validates/narrows `data`; return `null` to fall back to the default view. */
  readonly parse: (data: unknown) => TData | null;
  readonly present: (
    data: TData,
    notification: PresentableNotification,
    ctx: NotificationPresentContext
  ) => NotificationPresentation;
}
