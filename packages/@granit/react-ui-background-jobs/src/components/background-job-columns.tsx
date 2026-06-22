import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@granit/react-ui';
import { cn } from '@granit/utils';
import cronstrue from 'cronstrue';
import { AlertTriangle, Clock, MoreHorizontal, Pause, Play, Zap } from 'lucide-react';

import { getCronstrueLocale } from '../cronstrue-locale';

import type { BackgroundJobStatus } from '@granit/background-jobs';
import type { useTranslation } from '@granit/react-localization';
import type { ColumnDef } from '@tanstack/react-table';

// Derive the translate function type from the localization hook rather than
// importing `TFunction` from i18next directly — keeps the column factory immune
// to i18next major-version skew between linked workspace packages.
type TranslateFn = ReturnType<typeof useTranslation>['t'];

interface BackgroundJobColumnOptions {
  readonly t: TranslateFn;
  readonly locale: string;
  readonly formatDateTime: (date: string | Date) => string;
  readonly formatTimeAgo: (date: string | Date) => string;
  readonly onPause: (job: BackgroundJobStatus) => void;
  readonly onResume: (job: BackgroundJobStatus) => void;
  readonly onTrigger: (job: BackgroundJobStatus) => void;
  readonly isMutating?: boolean;
}

function getStatusVariant(job: BackgroundJobStatus) {
  if (!job.isEnabled) return 'secondary' as const;
  if (job.consecutiveFailures > 0) return 'destructive' as const;
  return 'default' as const;
}

export function createBackgroundJobColumns({
  t,
  locale,
  formatDateTime,
  formatTimeAgo,
  onPause,
  onResume,
  onTrigger,
  isMutating,
}: BackgroundJobColumnOptions): ColumnDef<BackgroundJobStatus, unknown>[] {
  return [
    {
      id: 'jobName',
      accessorKey: 'jobName',
      header: t('BackgroundJobs.Columns.JobName'),
      enableSorting: true,
      cell: ({ row }) => (
        <span className="font-mono text-sm font-medium text-foreground">
          {row.original.jobName}
        </span>
      ),
    },
    {
      id: 'cronExpression',
      accessorKey: 'cronExpression',
      header: t('BackgroundJobs.Columns.CronExpression'),
      enableSorting: false,
      cell: ({ row }) => {
        const expr = row.original.cronExpression;
        const human = cronstrue.toString(expr, {
          locale: getCronstrueLocale(locale),
          throwExceptionOnParseError: false,
        });
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="flex cursor-default items-center gap-1.5 text-sm text-muted-foreground">
                <Clock className="size-3.5 shrink-0" />
                {human}
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <span className="font-mono">{expr}</span>
            </TooltipContent>
          </Tooltip>
        );
      },
    },
    {
      id: 'isEnabled',
      accessorKey: 'isEnabled',
      header: t('BackgroundJobs.Columns.Status'),
      enableSorting: false,
      cell: ({ row }) => {
        const job = row.original;
        const variant = getStatusVariant(job);
        let label: string;
        if (job.isEnabled) {
          label =
            job.consecutiveFailures > 0
              ? t('BackgroundJobs.Status.Failing')
              : t('BackgroundJobs.Status.Active');
        } else {
          label = t('BackgroundJobs.Status.Paused');
        }
        return (
          <Badge
            variant={variant}
            className={cn(
              'text-xs',
              variant === 'default' &&
                'bg-success-500/15 text-success-600 dark:text-success-500 border-success-500/25'
            )}
          >
            {label}
          </Badge>
        );
      },
    },
    {
      id: 'lastExecutedAt',
      accessorKey: 'lastExecutedAt',
      header: t('BackgroundJobs.Columns.LastExecution'),
      enableSorting: true,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.lastExecutedAt
            ? formatTimeAgo(row.original.lastExecutedAt)
            : t('BackgroundJobs.Never')}
        </span>
      ),
    },
    {
      id: 'nextExecutionAt',
      accessorKey: 'nextExecutionAt',
      header: t('BackgroundJobs.Columns.NextExecution'),
      enableSorting: true,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.nextExecutionAt
            ? formatDateTime(row.original.nextExecutionAt)
            : t('BackgroundJobs.NotScheduled')}
        </span>
      ),
    },
    {
      id: 'consecutiveFailures',
      accessorKey: 'consecutiveFailures',
      header: t('BackgroundJobs.Columns.Failures'),
      enableSorting: true,
      cell: ({ row }) => {
        const job = row.original;
        if (job.consecutiveFailures === 0 && job.deadLetterCount === 0) return null;
        return (
          <div className="space-y-0.5">
            {job.consecutiveFailures > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="flex items-center gap-1 text-destructive">
                    <AlertTriangle className="size-3.5" />
                    {job.consecutiveFailures}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  {job.lastError ?? t('BackgroundJobs.Status.Failing')}
                </TooltipContent>
              </Tooltip>
            )}
            {job.deadLetterCount > 0 && (
              <span className="text-xs text-orange-700 dark:text-orange-400">
                {t('BackgroundJobs.DeadLetters', { count: job.deadLetterCount })}
              </span>
            )}
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: '',
      enableSorting: false,
      cell: ({ row }) => {
        const job = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                aria-label={`Actions for ${job.jobName}`}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {job.isEnabled ? (
                <DropdownMenuItem disabled={isMutating} onClick={() => onPause(job)}>
                  <Pause className="mr-2 size-4" />
                  {t('BackgroundJobs.Actions.Pause')}
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem disabled={isMutating} onClick={() => onResume(job)}>
                  <Play className="mr-2 size-4" />
                  {t('BackgroundJobs.Actions.Resume')}
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                disabled={isMutating || !job.isEnabled}
                onClick={() => onTrigger(job)}
              >
                <Zap className="mr-2 size-4" />
                {t('BackgroundJobs.Actions.Trigger')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
