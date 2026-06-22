import { usePauseJob, useResumeJob, useTriggerJob } from '@granit/react-background-jobs';
import { useTranslation } from '@granit/react-localization';
import { Button, Tooltip, TooltipContent, TooltipTrigger } from '@granit/react-ui';
import { Pause, Play, Zap } from 'lucide-react';

import type { BackgroundJobStatus } from '@granit/background-jobs';

export function JobActions({ job }: Readonly<{ job: BackgroundJobStatus }>) {
  const { t } = useTranslation();
  const pauseJob = usePauseJob();
  const resumeJob = useResumeJob();
  const triggerJob = useTriggerJob();

  const isMutating = pauseJob.isPending || resumeJob.isPending || triggerJob.isPending;

  return (
    <div data-slot="job-actions" className="flex gap-1">
      {job.isEnabled ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              disabled={isMutating}
              onClick={() => pauseJob.mutate(job.jobName)}
            >
              <Pause className="size-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t('BackgroundJobs.Actions.Pause')}</TooltipContent>
        </Tooltip>
      ) : (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              disabled={isMutating}
              onClick={() => resumeJob.mutate(job.jobName)}
            >
              <Play className="size-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t('BackgroundJobs.Actions.Resume')}</TooltipContent>
        </Tooltip>
      )}

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={isMutating || !job.isEnabled}
            onClick={() => triggerJob.mutate(job.jobName)}
          >
            <Zap className="size-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>{t('BackgroundJobs.Actions.Trigger')}</TooltipContent>
      </Tooltip>
    </div>
  );
}
