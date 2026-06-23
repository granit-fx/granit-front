import { useTranslation } from '@granit/react-localization';

import type { SessionsCardLabels } from './sessions-card';

/**
 * Which session card is rendering: the caller's own list (`self`) or an admin
 * viewing another user's sessions (`admin`). Only the title and the
 * "revoke all" wording differ — everything else is shared.
 */
export type SessionsScope = 'self' | 'admin';

/**
 * Resolve the {@link SessionsCardLabels} for a session card from the shared
 * `Sessions.*` translation namespace. Both the self-service and admin cards go
 * through this, so the common strings (status, dates, IP, revoke verb) live in
 * one place instead of being duplicated across `MySessions.*` and
 * `Users.Sessions.*`. Only the title and the bulk-revoke label vary by scope:
 * self-service keeps "all others" (it can't revoke the current session), the
 * admin view revokes them all.
 */
export function useSessionsCardLabels(scope: SessionsScope): SessionsCardLabels {
  const { t } = useTranslation();
  return {
    title: t(scope === 'self' ? 'Sessions.MyTitle' : 'Sessions.AdminTitle'),
    empty: t('Sessions.Empty'),
    current: t('Sessions.Current'),
    createdAt: t('Sessions.Started'),
    lastAccess: t('Sessions.LastActivity'),
    unknownDevice: t('Sessions.UnknownDevice'),
    ipAddress: t('Sessions.IpAddress'),
    active: t('Sessions.Active'),
    inactive: t('Sessions.Inactive'),
    revoke: t('Sessions.Revoke'),
    revokeAll: t(scope === 'self' ? 'Sessions.RevokeAllOthers' : 'Sessions.RevokeAll'),
  };
}
