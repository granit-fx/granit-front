import { useGranitClient } from '@granit/react-api-client';
import {
  BackgroundJobsProvider,
  useBackgroundJobs,
  usePauseJob,
  useResumeJob,
  useTriggerJob,
} from '@granit/react-background-jobs';
import { useDateFormatter, useTranslation } from '@granit/react-localization';
import { Button, Card, CardContent, Spinner } from '@granit/react-ui';
import { EmptyState, ManualDataTable, ViewSwitcher } from '@granit/react-ui-admin-kit';
import { RotateCw } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';

import { createBackgroundJobColumns } from './components/background-job-columns';
import { JobCard } from './components/job-card';

import type { BackgroundJobStatus } from '@granit/background-jobs';
import type { ViewMode } from '@granit/react-ui-admin-kit';

// ---------------------------------------------------------------------------
// Kanban view
// ---------------------------------------------------------------------------

function JobKanbanView({ jobs }: Readonly<{ jobs: readonly BackgroundJobStatus[] }>) {
  return (
    <div data-slot="job-kanban-view" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {jobs.map((job) => (
        <JobCard key={job.jobName} job={job} />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export function BackgroundJobListPage() {
  // The Axios client is resolved from the GranitClientProvider in the host tree
  // and handed to the headless data provider — no `@/lib/api` coupling.
  const client = useGranitClient();
  return (
    <BackgroundJobsProvider config={{ client }}>
      <BackgroundJobListPageContent />
    </BackgroundJobsProvider>
  );
}

function BackgroundJobListPageContent() {
  const { t, i18n } = useTranslation();
  const { formatDateTime, formatTimeAgo } = useDateFormatter();
  const [view, setView] = useState<ViewMode>('list');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const { data, isLoading, isFetching, refetch } = useBackgroundJobs({ page, pageSize });

  // Mutations
  const pauseJob = usePauseJob();
  const resumeJob = useResumeJob();
  const triggerJob = useTriggerJob();
  const isMutating = pauseJob.isPending || resumeJob.isPending || triggerJob.isPending;

  const handlePause = useCallback(
    (job: BackgroundJobStatus) => pauseJob.mutate(job.jobName),
    [pauseJob]
  );
  const handleResume = useCallback(
    (job: BackgroundJobStatus) => resumeJob.mutate(job.jobName),
    [resumeJob]
  );
  const handleTrigger = useCallback(
    (job: BackgroundJobStatus) => triggerJob.mutate(job.jobName),
    [triggerJob]
  );

  const columns = useMemo(
    () =>
      createBackgroundJobColumns({
        t,
        locale: i18n.language,
        formatDateTime,
        formatTimeAgo,
        onPause: handlePause,
        onResume: handleResume,
        onTrigger: handleTrigger,
        isMutating,
      }),
    [
      t,
      i18n.language,
      formatDateTime,
      formatTimeAgo,
      handlePause,
      handleResume,
      handleTrigger,
      isMutating,
    ]
  );

  const jobs = data?.items ?? [];

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div data-slot="background-job-list-page" className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">{t('BackgroundJobs.Title')}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t('BackgroundJobs.Subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <ViewSwitcher view={view} onViewChange={setView} />
          <Button variant="outline" size="sm" disabled={isFetching} onClick={() => refetch()}>
            <RotateCw className={`size-4 ${isFetching ? 'animate-spin' : ''}`} />
            {t('Common.Refresh')}
          </Button>
        </div>
      </div>

      {/* Kanban view */}
      {view === 'kanban' && jobs.length > 0 && <JobKanbanView jobs={jobs} />}
      {view === 'kanban' && jobs.length === 0 && (
        <Card>
          <CardContent>
            <EmptyState message={t('BackgroundJobs.NoJobs')} />
          </CardContent>
        </Card>
      )}

      {/* List view */}
      {view !== 'kanban' && (
        <ManualDataTable
          columns={columns}
          data={jobs}
          totalCount={data?.totalCount ?? 0}
          page={page}
          pageSize={pageSize}
          pageSizes={[10, 20, 50]}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
          hidePaginationOnSinglePage
        />
      )}
    </div>
  );
}
