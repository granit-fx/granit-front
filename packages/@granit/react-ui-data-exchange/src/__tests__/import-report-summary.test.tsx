import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ImportReportSummary } from '../components/import/import-report-summary';

import { renderDataExchange } from './test-utils';

import type { ImportReportResponse } from '@granit/data-exchange';

function makeReport(overrides: Partial<ImportReportResponse> = {}): ImportReportResponse {
  return {
    importJobId: 'job-1',
    finalStatus: 'Completed',
    totalRows: 10,
    succeededRows: 10,
    failedRows: 0,
    skippedRows: 0,
    insertedRows: 8,
    updatedRows: 2,
    duration: '00:00:01',
    rowErrors: [],
    ...overrides,
  };
}

describe('ImportReportSummary', () => {
  it('should render the completed state', () => {
    renderDataExchange(<ImportReportSummary report={makeReport()} />);
    expect(screen.getByText('Import completed')).toBeInTheDocument();
    expect(screen.getByText('00:00:01')).toBeInTheDocument();
  });

  it('should render the partially-completed state', () => {
    renderDataExchange(
      <ImportReportSummary report={makeReport({ finalStatus: 'PartiallyCompleted' })} />
    );
    expect(screen.getByText('Partially completed')).toBeInTheDocument();
  });

  it('should render a failed status with the lowercased label', () => {
    renderDataExchange(<ImportReportSummary report={makeReport({ finalStatus: 'Failed' })} />);
    expect(screen.getByText('Import failed')).toBeInTheDocument();
  });

  it('should show the correction download only when there are errors and a handler', async () => {
    const onDownloadCorrection = vi.fn();
    const { user } = renderDataExchange(
      <ImportReportSummary
        report={makeReport({ failedRows: 3, succeededRows: 7 })}
        onDownloadCorrection={onDownloadCorrection}
      />
    );
    const button = screen.getByRole('button', { name: /download correction file/i });
    await user.click(button);
    expect(onDownloadCorrection).toHaveBeenCalledTimes(1);
  });

  it('should hide the correction download when there are no errors', () => {
    renderDataExchange(
      <ImportReportSummary report={makeReport()} onDownloadCorrection={vi.fn()} />
    );
    expect(
      screen.queryByRole('button', { name: /download correction file/i })
    ).not.toBeInTheDocument();
  });

  it('should hide the correction download when no handler is provided', () => {
    renderDataExchange(<ImportReportSummary report={makeReport({ failedRows: 2 })} />);
    expect(
      screen.queryByRole('button', { name: /download correction file/i })
    ).not.toBeInTheDocument();
  });
});
