import { useTranslation } from '@granit/react-localization';
import { Badge } from '@granit/react-ui';

import type { SubscriptionStatus } from '@granit/subscriptions';

const VARIANT_MAP: Record<SubscriptionStatus, 'default' | 'secondary' | 'destructive' | 'outline'> =
  {
    Trial: 'secondary',
    Active: 'default',
    PastDue: 'secondary',
    Suspended: 'destructive',
    Cancelled: 'destructive',
    Expired: 'destructive',
  };

interface SubscriptionStatusBadgeProps {
  readonly status: SubscriptionStatus;
}

export function SubscriptionStatusBadge({ status }: SubscriptionStatusBadgeProps) {
  const { t } = useTranslation();

  return (
    <Badge data-slot="subscription-status-badge" variant={VARIANT_MAP[status] ?? 'outline'}>
      {t(`Subscriptions.Status.${status}`)}
    </Badge>
  );
}
