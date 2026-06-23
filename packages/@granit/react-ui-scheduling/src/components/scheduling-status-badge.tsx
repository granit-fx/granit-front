import { useTranslation } from '@granit/react-localization';
import { Badge } from '@granit/react-ui';
import { SCHEDULING_STATUS_COLORS } from '@granit/scheduling';
import { cn } from '@granit/utils';

import type { ScheduledActionStatus } from '@granit/scheduling';

const variantMap: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  blue: 'default',
  green: 'default',
  gray: 'secondary',
  red: 'destructive',
  amber: 'outline',
};

const colorClassMap: Record<string, string> = {
  blue: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/25',
  green: 'bg-success-500/15 text-success-600 dark:text-success-500 border-success-500/25',
  gray: '',
  red: '',
  amber: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/25',
};

export function SchedulingStatusBadge({ status }: Readonly<{ status: ScheduledActionStatus }>) {
  const { t } = useTranslation();
  const color = SCHEDULING_STATUS_COLORS[status] ?? 'gray';
  const variant = variantMap[color] ?? 'secondary';
  const colorClass = colorClassMap[color] ?? '';

  return (
    <Badge variant={variant} className={cn('text-xs', colorClass)}>
      {t(`Scheduling.Status.${status}`)}
    </Badge>
  );
}
