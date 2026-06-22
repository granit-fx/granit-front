import { useGranitClient } from '@granit/react-api-client';
import { ImportProvider, useImportJobs } from '@granit/react-data-exchange';
import { useDateFormatter, useTranslation } from '@granit/react-localization';
import { Spinner } from '@granit/react-ui';
import { QueryDataTable } from '@granit/react-ui-admin-kit';
import { useCallback, useMemo, useState } from 'react';

import { HistoryFilters } from './components/history-filters';
import { createImportHistoryColumns } from './components/import-history-columns';
import { ImportReportDialog } from './components/import-report-dialog';
import { DEFAULT_PAGE_SIZE } from './constants';

import type { ImportJobResponse, ImportJobStatus } from '@granit/data-exchange';

const IMPORT_BASE_PATH = '/api/v1/data-exchange';

export function ImportListPage() {
  // The Axios client is resolved from the GranitClientProvider in the host tree
  // and handed to the headless data provider — no `@/lib/api` coupling.
  const client = useGranitClient();
  return (
    <ImportProvider config={{ client, basePath: IMPORT_BASE_PATH }}>
      <ImportListPageContent />
    </ImportProvider>
  );
}

function ImportListPageContent() {
  const { t } = useTranslation();
  const { formatDateTime } = useDateFormatter();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<ImportJobStatus | undefined>();
  const [reportJob, setReportJob] = useState<ImportJobResponse | null>(null);

  const query = useImportJobs({
    page,
    pageSize: DEFAULT_PAGE_SIZE,
    status,
  });

  const handleViewReport = useCallback((job: ImportJobResponse) => {
    setReportJob(job);
  }, []);

  const columns = useMemo(
    () => createImportHistoryColumns({ t, formatDateTime, onViewReport: handleViewReport }),
    [t, formatDateTime, handleViewReport]
  );

  if (query.isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div data-slot="import-list-page" className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">{t('DataExchange.Import.Title')}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t('DataExchange.Import.Subtitle')}</p>
      </div>

      <div className="space-y-4">
        <HistoryFilters
          mode="import"
          status={status}
          onStatusChange={(v) => {
            setStatus(v as ImportJobStatus | undefined);
            setPage(1);
          }}
        />

        <QueryDataTable
          columns={columns}
          data={query.data?.items ?? []}
          totalCount={query.data?.totalCount ?? 0}
          isLoading={query.isFetching}
          page={page}
          pageSize={DEFAULT_PAGE_SIZE}
          onPageChange={setPage}
          onPageSizeChange={() => {}}
        />

        <ImportReportDialog
          job={reportJob}
          open={!!reportJob}
          onOpenChange={(open) => {
            if (!open) setReportJob(null);
          }}
        />
      </div>
    </div>
  );
}
