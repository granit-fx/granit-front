import { cn } from '@granit/utils';
import { ExternalLink } from 'lucide-react';
import { Link } from 'react-router';

import type { NotificationActionLink } from '@granit/react-notifications';

/** True when the target is an absolute `http(s)` URL (external link). */
function isExternal(to: string): boolean {
  return /^https?:\/\//i.test(to);
}

export interface NotificationActionProps {
  readonly action: NotificationActionLink;
  /** Invoked on click — typically to mark the notification as read. */
  readonly onActivate?: () => void;
  readonly className?: string;
}

/**
 * Renders a notification's click-through action. Resolves internal routes to a
 * React Router `Link` and absolute URLs to a new-tab anchor, keeping the visual
 * treatment identical across both.
 */
export function NotificationAction({ action, onActivate, className }: NotificationActionProps) {
  const classes = cn(
    'inline-flex items-center gap-1 py-1 text-xs font-medium text-primary hover:underline',
    className
  );

  if (isExternal(action.to)) {
    return (
      <a
        data-slot="notification-action"
        href={action.to}
        target="_blank"
        rel="noopener noreferrer"
        className={classes}
        onClick={onActivate}
      >
        {action.label}
        <ExternalLink className="h-3 w-3" aria-hidden />
      </a>
    );
  }

  return (
    <Link data-slot="notification-action" to={action.to} className={classes} onClick={onActivate}>
      {action.label}
    </Link>
  );
}
