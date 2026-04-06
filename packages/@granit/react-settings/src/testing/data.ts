import type { AdminAppSetting } from '@granit/settings';

type Mutable<T> = { -readonly [K in keyof T]: T[K] };

export const mockAppSettings: Mutable<AdminAppSetting>[] = [
  {
    key: 'audit.retention_days',
    label: 'Audit Log Retention',
    description: 'Number of days to retain audit logs before automatic purge.',
    value: '1095',
    type: 'number',
  },
  {
    key: 'auth.session_timeout_minutes',
    label: 'Session Timeout',
    description: 'Idle session timeout in minutes. Users will be logged out after this period.',
    value: '30',
    type: 'number',
  },
  {
    key: 'api.rate_limit_per_minute',
    label: 'API Rate Limit',
    description: 'Maximum API requests allowed per minute per user.',
    value: '100',
    type: 'number',
  },
  {
    key: 'ui.default_page_size',
    label: 'Default Page Size',
    description: 'Default number of items per page in list views.',
    value: '20',
    type: 'number',
  },
  {
    key: 'notifications.email_enabled',
    label: 'Email Notifications',
    description: 'Enable email notifications for system events and alerts.',
    value: 'true',
    type: 'boolean',
  },
  {
    key: 'system.maintenance_mode',
    label: 'Maintenance Mode',
    description: 'Enable maintenance mode to block user access during scheduled maintenance.',
    value: 'false',
    type: 'boolean',
  },
];

/** In-memory settings store per scope. */
export const mockSettingsStore: Record<string, Record<string, string | null>> = {
  user: {
    'Granit.Localization.PreferredCulture': 'fr',
    'Granit.Timing.PreferredTimezone': 'Europe/Brussels',
  },
  global: {
    'audit.retention_days': '1095',
    'auth.session_timeout_minutes': '30',
    'api.rate_limit_per_minute': '100',
    'ui.default_page_size': '20',
    'notifications.email_enabled': 'true',
    'system.maintenance_mode': 'false',
  },
  tenant: {
    'ui.default_page_size': '20',
    'notifications.email_enabled': 'true',
  },
};
