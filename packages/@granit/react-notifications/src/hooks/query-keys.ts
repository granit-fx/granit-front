// ---------------------------------------------------------------------------
// Query key builder
// ---------------------------------------------------------------------------

import type { NotificationConfig } from '@granit/notifications';

const DEFAULT_QUERY_KEY_PREFIX = ['notifications'] as const;

/**
 * Builds a config-scoped query key for notifications queries. The module
 * namespace (default `['notifications']`) is prepended, so a host mounting
 * several isolated notification scopes can override it via the config's
 * optional `queryKeyPrefix`.
 *
 * @param config - Notification config, optionally carrying a `queryKeyPrefix`.
 * @param segments - Additional segments appended after the prefix.
 */
export function buildNotificationsQueryKey(
  config: NotificationConfig & { queryKeyPrefix?: readonly string[] },
  ...segments: readonly unknown[]
): readonly unknown[] {
  return [...(config.queryKeyPrefix ?? DEFAULT_QUERY_KEY_PREFIX), ...segments];
}
