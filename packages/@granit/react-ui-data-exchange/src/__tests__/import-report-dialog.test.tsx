import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ImportReportDialog } from '../components/import-report-dialog';

import { renderDataExchange } from './test-utils';

import type { ImportJobResponse, ImportReportResponse } from '@granit/data-exchange';

const downloadCorrection = vi.fn();
const reportState: {
  data: ImportReportResponse | null;
  isLoading: boolean;
} = { data: null, isLoading: false };

vi.mock('@granit/react-data-exchange', () => ({
  useImportReport: () => ({
    report: { data: reportState.data, isLoading: reportState.isLoading },
    downloadCorrection,
  }),
}));

const job: ImportJobResponse = {
  id: 'job-1',
  definitionName: 'Admin.UserImport',
  status: 'Completed',
  originalFileName: 'users.csv',
  createdAt: '2026-01-01T00:00:00Z',
} as ImportJobResponse;

function makeReport(overrides: Partial<ImportReportResponse> = {}): ImportReportResponse {
  return {
    importJobId: 'job-1',
    finalStatus: 'Completed',
    totalRows: 10,
    succeededRows: 9,
    failedRows: 1,
    skippedRows: 0,
    insertedRows: 9,
    updatedRows: 0,
    duration: '00:00:02',
    rowErrors: [],
    ...overrides,
  };
}

describe('ImportReportDialog', () => {
  beforeEach(() => {
    reportState.data = null;
    reportState.isLoading = false;
    downloadCorrection.mockReset();
  });

  it('should not render content when closed', () => {
    renderDataExchange(<ImportReportDialog job={job} open={false} onOpenChange={vi.fn()} />);
    expect(document.querySelector('[data-slot="import-report-dialog"]')).not.toBeInTheDocument();
  });

  it('should render a spinner while loading', () => {
    reportState.isLoading = true;
    renderDataExchange(<ImportReportDialog job={job} open onOpenChange={vi.fn()} />);
    expect(screen.getByText('Import Report')).toBeInTheDocument();
    expect(screen.queryByText('users.csv')).not.toBeInTheDocument();
  });

  it('should render report stats without an error table when there are no row errors', () => {
    reportState.data = makeReport({ failedRows: 0, succeededRows: 10, rowErrors: [] });
    renderDataExchange(<ImportReportDialog job={job} open onOpenChange={vi.fn()} />);
    expect(screen.getByText('users.csv')).toBeInTheDocument();
    expect(screen.getByText('00:00:02', { exact: false })).toBeInTheDocument();
    expect(screen.queryByText('Row errors')).not.toBeInTheDocument();
  });

  it('should render the row-error table and trigger download', async () => {
    reportState.data = makeReport({
      rowErrors: [{ rowNumber: 3, kind: 'Validation', errorCodes: ['E1'], message: 'bad value' }],
    });
    const { user } = renderDataExchange(
      <ImportReportDialog job={job} open onOpenChange={vi.fn()} />
    );
    expect(screen.getByText('Row errors')).toBeInTheDocument();
    expect(screen.getByText('bad value')).toBeInTheDocument();
    expect(screen.getByText('Validation')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Download correction file/ }));
    expect(downloadCorrection).toHaveBeenCalledTimes(1);
  });
});
