import { useTranslation } from '@granit/react-localization';
import { Badge } from '@granit/react-ui';

import type { BackgroundJobStatus } from '@granit/background-jobs';

export function JobStatusBadge({ job }: Readonly<{ job: BackgroundJobStatus }>) {
  const { t } = useTranslation();

  if (!job.isEnabled) {
    return (
      <Badge data-slot="job-status-badge" variant="secondary">
        {t('BackgroundJobs.Status.Paused')}
      </Badge>
    );
  }
  if (job.consecutiveFailures > 0) {
    return (
      <Badge data-slot="job-status-badge" variant="destructive">
        {t('BackgroundJobs.Status.Failing')}
      </Badge>
    );
  }
  return (
    <Badge
      data-slot="job-status-badge"
      variant="default"
      className="border-success-500/25 bg-success-500/15 text-success hover:bg-success-500/25"
    >
      {t('BackgroundJobs.Status.Active')}
    </Badge>
  );
}
