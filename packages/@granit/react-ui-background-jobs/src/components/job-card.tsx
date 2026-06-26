import { useDateFormatter, useTranslation } from '@granit/react-localization';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@granit/react-ui';
import { cn } from '@granit/utils';
import cronstrue from 'cronstrue';
import { AlertTriangle, Clock } from 'lucide-react';

import { getCronstrueLocale } from '../cronstrue-locale';

import { JobActions } from './job-actions';
import { JobStatusBadge } from './job-status-badge';

import type { BackgroundJobStatus } from '@granit/background-jobs';

export function JobCard({ job }: Readonly<{ job: BackgroundJobStatus }>) {
  const { t, i18n } = useTranslation();
  const { formatDateTime, formatTimeAgo } = useDateFormatter();
  const cronHuman = cronstrue.toString(job.cronExpression, {
    locale: getCronstrueLocale(i18n.language),
    throwExceptionOnParseError: false,
  });

  return (
    <Card
      data-slot="job-card"
      className={cn(
        job.consecutiveFailures > 0 && 'border-destructive/50',
        job.isEnabled || 'opacity-70'
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="font-mono text-sm">{job.jobName}</CardTitle>
            <CardDescription className="flex items-center gap-1.5">
              <Clock className="size-3.5 shrink-0" />
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="cursor-default">{cronHuman}</span>
                </TooltipTrigger>
                <TooltipContent>
                  <span className="font-mono">{job.cronExpression}</span>
                </TooltipContent>
              </Tooltip>
            </CardDescription>
          </div>
          <JobStatusBadge job={job} />
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-muted-foreground">{t('BackgroundJobs.LastExecution')}</p>
            <p className="font-medium">
              {job.lastExecutedAt ? formatTimeAgo(job.lastExecutedAt) : t('BackgroundJobs.Never')}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">{t('BackgroundJobs.NextExecution')}</p>
            <p className="font-medium">
              {job.nextExecutionAt
                ? formatDateTime(job.nextExecutionAt)
                : t('BackgroundJobs.NotScheduled')}
            </p>
          </div>
        </div>

        {job.consecutiveFailures > 0 && (
          <div className="rounded-md bg-destructive/10 p-2 text-sm">
            <div className="flex items-center gap-1.5 font-medium text-destructive">
              <AlertTriangle className="size-3.5" />
              {t('BackgroundJobs.Failures', { count: job.consecutiveFailures })}
            </div>
            {job.lastError && (
              <p className="mt-1 truncate font-mono text-xs text-destructive/80">{job.lastError}</p>
            )}
          </div>
        )}

        {job.deadLetterCount > 0 && (
          <div className="rounded-md bg-warning-500/10 p-2 text-sm">
            <p className="font-medium text-warning">
              {t('BackgroundJobs.DeadLetters', { count: job.deadLetterCount })}
            </p>
          </div>
        )}

        <div className="pt-1">
          <JobActions job={job} />
        </div>
      </CardContent>
    </Card>
  );
}
