import { useTranslation } from '@granit/react-localization';
import { Badge } from '@granit/react-ui';
import { cn } from '@granit/utils';

import type { ExportJobStatus, ImportJobStatus } from '@granit/data-exchange';

type JobStatus = ImportJobStatus | ExportJobStatus;

function getVariant(status: JobStatus) {
  switch (status) {
    case 'Completed':
      return 'default' as const;
    case 'PartiallyCompleted':
      return 'outline' as const;
    case 'Failed':
      return 'destructive' as const;
    case 'Cancelled':
      return 'secondary' as const;
    default:
      return 'outline' as const;
  }
}

export function JobStatusBadge({ status }: Readonly<{ status: JobStatus }>) {
  const { t } = useTranslation();
  const variant = getVariant(status);

  return (
    <Badge
      data-slot="job-status-badge"
      variant={variant}
      className={cn(
        'text-xs',
        status === 'Completed' && 'bg-success-500/15 text-success border-success-500/25',
        status === 'PartiallyCompleted' &&
          'border-orange-500/25 bg-orange-500/15 text-orange-600 dark:text-orange-400'
      )}
    >
      {t(`DataExchange.Status.${status}`)}
    </Badge>
  );
}
