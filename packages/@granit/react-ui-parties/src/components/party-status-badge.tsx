import { useTranslation } from '@granit/react-localization';
import { Badge } from '@granit/react-ui';
import { cn } from '@granit/utils';

import type { PartyStatus } from '@granit/parties';

const statusVariants: Record<PartyStatus, string> = {
  Active: 'bg-success-500/15 text-success-600 border-success-500/25',
  Suspended: 'bg-amber-500/15 text-amber-600 border-amber-500/25',
  Archived: 'bg-muted/50 text-muted-foreground border-border',
};

interface PartyStatusBadgeProps {
  readonly status: PartyStatus;
}

export function PartyStatusBadge({ status }: PartyStatusBadgeProps) {
  const { t } = useTranslation();
  return (
    <Badge
      data-slot="party-status-badge"
      variant="outline"
      className={cn('text-xs', statusVariants[status])}
    >
      {t(`Parties.Status.${status}`)}
    </Badge>
  );
}
