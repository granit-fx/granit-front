import { downloadCorrectionFile, getImportReport } from '@granit/data-exchange';
import { useQuery } from '@tanstack/react-query';

import { logger } from '../../logger';
import { buildImportQueryKey, useImportConfig } from '../providers/import-provider';

import type { ImportReportResponse } from '@granit/data-exchange';
import type { UseQueryResult } from '@tanstack/react-query';

export interface UseImportReportReturn {
  /** Full execution report. */
  readonly report: UseQueryResult<ImportReportResponse>;
  /**
   * Download the correction file with error rows. Resolves to `true` when a
   * file was streamed to the browser, `false` when the server returned no
   * content (empty blob / HTTP 204 — nothing to correct).
   */
  readonly downloadCorrection: () => Promise<boolean>;
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

  async function downloadCorrection(): Promise<boolean> {
    if (!jobId) return false;
    const { blob, fileName } = await downloadCorrectionFile(config.client, config.basePath, jobId);
    // The backend returns 204 (empty body) when there is no correction file to
    // produce. Guard against triggering a 0-byte download in that case.
    if (blob.size === 0) {
      logger.warn('Correction file is empty; skipping download', { jobId });
      return false;
    }
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
    return true;
  }

  return { report, downloadCorrection };
}
