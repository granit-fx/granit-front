import { downloadCorrectionFile, getImportReport } from '@granit/data-exchange';
import { useQuery } from '@tanstack/react-query';

import { buildImportQueryKey, useImportConfig } from '../providers/import-provider';

import type { ImportReportResponse } from '@granit/data-exchange';
import type { UseQueryResult } from '@tanstack/react-query';

export interface UseImportReportReturn {
  /** Full execution report. */
  readonly report: UseQueryResult<ImportReportResponse>;
  /** Download the correction file with error rows. */
  readonly downloadCorrection: () => Promise<void>;
}

/**
 * Hook for fetching the import report and downloading the correction file.
 */
export function useImportReport(jobId: string | undefined): UseImportReportReturn {
  const config = useImportConfig();

  const report = useQuery({
    queryKey: buildImportQueryKey(config, 'report', jobId ?? ''),
    queryFn: () => getImportReport(config.client, config.basePath, jobId!),
    enabled: !!jobId,
    staleTime: 30 * 1000,
  });

  async function downloadCorrection() {
    if (!jobId) return;
    const { blob, fileName } = await downloadCorrectionFile(config.client, config.basePath, jobId);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  }

  return { report, downloadCorrection };
}
