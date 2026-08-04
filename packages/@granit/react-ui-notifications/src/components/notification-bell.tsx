import { useDateFormatter, useTranslation } from '@granit/react-localization';
import { useNotifications, useUnreadCount } from '@granit/react-notifications';
import { Button, Popover, PopoverContent, PopoverTrigger } from '@granit/react-ui';
import { cn } from '@granit/utils';
import { Bell, CheckCheck, ExternalLink } from 'lucide-react';
import { useMemo } from 'react';
import { Link } from 'react-router';

import { BELL_PREVIEW_SIZE } from '../constants';
import { resolveNotificationPresentation } from '../rendering';

import type { NotificationPresentContext } from '../rendering';
import type { NotificationSeverity } from '@granit/notifications';

const severityColors: Record<NotificationSeverity, string> = {
  Info: 'bg-blue-500',
  Success: 'bg-green-500',
  Warning: 'bg-amber-500',
  Error: 'bg-red-500',
  Fatal: 'bg-red-900',
};

export function NotificationBell() {
  const { t } = useTranslation();
  const { formatTimeAgo } = useDateFormatter();
  const { count, refresh: refreshCount } = useUnreadCount();
  const {
    notifications,
    loading,
    markRead,
    markAllRead,
    refresh: refreshList,
  } = useNotifications({
    pageSize: BELL_PREVIEW_SIZE,
  });

  const presentationCtx = useMemo<NotificationPresentContext>(
    () => ({ t: (key, options) => t(key as never, options) as string }),
    [t]
  );

  const handleMarkAllRead = async () => {
    await markAllRead();
    refreshCount();
  };

  const handleNotificationClick = async (id: string, isRead: boolean) => {
    if (!isRead) {
      await markRead(id);
      refreshCount();
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (open) {
      refreshList();
    }
  };

  const displayCount = count > 99 ? '99+' : String(count);

  return (
    <Popover onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          data-slot="notification-bell"
          className="relative rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground outline-none cursor-pointer"
          aria-label={t('Notifications.Title')}
        >
          <Bell className="h-5 w-5" />
          {count > 0 && (
            <span
              data-slot="notification-badge"
              className="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white"
              aria-label={`${count} unread`}
            >
              {displayCount}
            </span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent align="end" sideOffset={8} className="w-96 p-0">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h3 className="text-sm font-semibold text-foreground">{t('Notifications.Title')}</h3>
          {count > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto px-2 py-1 text-xs"
              onClick={handleMarkAllRead}
            >
              <CheckCheck className="mr-1 h-3 w-3" />
              {t('Notifications.MarkAllRead')}
            </Button>
          )}
        </div>

        {/* Notification list */}
        <div className="max-h-80 overflow-y-auto">
          {loading && (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
              {t('Common.Loading')}
            </div>
          )}

          {!loading && notifications.length === 0 && (
            <div className="px-4 py-6 text-center">
              <p className="text-sm font-medium text-foreground">
                {t('Notifications.NoNotifications')}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {t('Notifications.NoNotificationsDescription')}
              </p>
            </div>
          )}

          {!loading && notifications.length > 0 && (
            <ul>
              {notifications.map((notification) => {
                const presentation = resolveNotificationPresentation(notification, presentationCtx);
                const isRead = notification.state === 'Read';
                const severity = presentation.severity ?? notification.severity;
                return (
                  <li key={notification.id}>
                    <button
                      className={cn(
                        'w-full cursor-pointer px-4 py-3 text-left transition-colors hover:bg-accent',
                        !isRead && 'bg-primary/5'
                      )}
                      onClick={() => handleNotificationClick(notification.id, isRead)}
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className={cn(
                            'mt-1.5 h-2 w-2 shrink-0 rounded-full',
                            severityColors[severity]
                          )}
                          aria-hidden="true"
                        />
                        <div className="min-w-0 flex-1">
                          <p
                            className={cn(
                              'truncate text-sm',
                              isRead ? 'text-muted-foreground' : 'font-medium text-foreground'
                            )}
                          >
                            {presentation.title}
                          </p>
                          {presentation.body && (
                            <p className="mt-0.5 truncate text-xs text-muted-foreground">
                              {presentation.body}
                            </p>
                          )}
                          <p className="mt-1 text-xs text-muted-foreground/70">
                            {formatTimeAgo(notification.createdAt)}
                          </p>
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border px-4 py-2">
          <Link
            to="/notifications"
            className="flex items-center justify-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-accent"
          >
            {t('Notifications.ViewAll')}
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
