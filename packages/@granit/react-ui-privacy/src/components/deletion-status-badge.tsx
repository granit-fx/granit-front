import { useTranslation } from '@granit/react-localization';
import { Badge } from '@granit/react-ui';
import { cn } from '@granit/utils';

import type { DeletionState } from '@granit/privacy';

const statusStyles: Record<DeletionState, string> = {
  Deferred: 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/25',
  Executed: 'bg-destructive/15 text-destructive border-destructive/25',
  Cancelled: '',
};

export function DeletionStatusBadge({ status }: Readonly<{ status: DeletionState }>) {
  const { t } = useTranslation();

  const custom = statusStyles[status];

  return (
    <Badge
      data-slot="deletion-status-badge"
      variant={custom ? 'outline' : 'secondary'}
      className={cn('text-xs', custom)}
    >
      {t(`Privacy.Deletion.Status.${status}`)}
    </Badge>
  );
}
