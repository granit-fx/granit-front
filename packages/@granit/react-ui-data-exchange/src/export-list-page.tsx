import { downloadExportFile } from '@granit/data-exchange';
import { useGranitClient } from '@granit/react-api-client';
import { ExportProvider, useExportJobs } from '@granit/react-data-exchange';
import { useDateFormatter, useTranslation } from '@granit/react-localization';
import { Spinner } from '@granit/react-ui';
import { QueryDataTable } from '@granit/react-ui-admin-kit';
import { useCallback, useMemo, useState } from 'react';

import { createExportHistoryColumns } from './components/export-history-columns';
import { HistoryFilters } from './components/history-filters';
import { DEFAULT_PAGE_SIZE } from './constants';

import type { AxiosInstance } from '@granit/api-client';
import type { ExportJobResponse, ExportJobStatus } from '@granit/data-exchange';

const EXPORT_BASE_PATH = '/api/v1/data-exchange';

export function ExportListPage() {
  // The Axios client is resolved from the GranitClientProvider in the host tree
  // and handed to the headless data provider — no `@/lib/api` coupling.
  const client = useGranitClient();
  return (
    <ExportProvider config={{ client, basePath: EXPORT_BASE_PATH }}>
      <ExportListPageContent client={client} />
    </ExportProvider>
  );
}

function ExportListPageContent({ client }: Readonly<{ client: AxiosInstance }>) {
  const { t } = useTranslation();
  const { formatDateTime } = useDateFormatter();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<ExportJobStatus | undefined>();

  const query = useExportJobs({
    page,
    pageSize: DEFAULT_PAGE_SIZE,
    status,
  });

  const handleDownload = useCallback(
    async (job: ExportJobResponse) => {
      const { blob, fileName } = await downloadExportFile(client, EXPORT_BASE_PATH, job.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName ?? job.fileName ?? `export-${job.id}`;
      a.click();
      URL.revokeObjectURL(url);
    },
    [client]
  );

  const columns = useMemo(
    () => createExportHistoryColumns({ t, formatDateTime, onDownload: handleDownload }),
    [t, formatDateTime, handleDownload]
  );

  if (query.isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div data-slot="export-list-page" className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">{t('DataExchange.Export.Title')}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t('DataExchange.Export.Subtitle')}</p>
      </div>

      <div className="space-y-4">
        <HistoryFilters
          mode="export"
          status={status}
          onStatusChange={(v) => {
            setStatus(v as ExportJobStatus | undefined);
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
      </div>
    </div>
  );
}
