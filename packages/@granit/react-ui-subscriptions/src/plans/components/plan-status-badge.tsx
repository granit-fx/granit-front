import { useTranslation } from '@granit/react-localization';
import { Badge } from '@granit/react-ui';

import type { PlanLifecycleStatus } from '@granit/subscriptions';

const VARIANT_MAP: Record<PlanLifecycleStatus, 'outline' | 'default' | 'destructive'> = {
  Draft: 'outline',
  PendingReview: 'outline',
  Published: 'default',
  Archived: 'destructive',
};

interface PlanStatusBadgeProps {
  readonly status: PlanLifecycleStatus;
}

export function PlanStatusBadge({ status }: PlanStatusBadgeProps) {
  const { t } = useTranslation();

  return (
    <Badge data-slot="plan-status-badge" variant={VARIANT_MAP[status] ?? 'outline'}>
      {t(`Subscriptions.Plans.Status.${status}`)}
    </Badge>
  );
}
