import { mockExportHistory } from '@granit/react-data-exchange/testing';
import { screen } from '@testing-library/react';
import * as React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ExportListPage } from '../export-list-page';

import { renderDataExchange } from './test-utils';

import type { ExportJobResponse } from '@granit/data-exchange';
import type * as DataExchange from '@granit/data-exchange';

// The page consumes the @granit/react-data-exchange hooks directly. ExportProvider
// is stubbed to a passthrough; useGranitClient still resolves from the real
// GranitClientProvider supplied by the render helper.
const jobsState: {
  data: { items: ExportJobResponse[]; totalCount: number };
  isLoading: boolean;
  isFetching: boolean;
} = {
  data: { items: [], totalCount: 0 },
  isLoading: false,
  isFetching: false,
};

const downloadExportFile = vi.fn();

vi.mock('@granit/react-data-exchange', () => ({
  ExportProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useExportJobs: () => ({
    data: jobsState.data,
    isLoading: jobsState.isLoading,
    isFetching: jobsState.isFetching,
    refetch: vi.fn(),
  }),
}));

vi.mock('@granit/data-exchange', async (importOriginal) => {
  const actual = await importOriginal<typeof DataExchange>();
  return {
    ...actual,
    downloadExportFile: (...args: unknown[]) => downloadExportFile(...args),
  };
});

const completedJob: ExportJobResponse = mockExportHistory[0];

describe('ExportListPage', () => {
  beforeEach(() => {
    jobsState.data = { items: [], totalCount: 0 };
    jobsState.isLoading = false;
    jobsState.isFetching = false;
    downloadExportFile.mockReset();
  });

  it('should render the page title', () => {
    renderDataExchange(<ExportListPage />);
    expect(screen.getByRole('heading', { name: 'Export' })).toBeInTheDocument();
  });

  it('should have data-slot attribute', () => {
    renderDataExchange(<ExportListPage />);
    expect(document.querySelector('[data-slot="export-list-page"]')).toBeInTheDocument();
  });

  it('should render a spinner while loading', () => {
    jobsState.isLoading = true;
    renderDataExchange(<ExportListPage />);
    expect(document.querySelector('[data-slot="export-list-page"]')).not.toBeInTheDocument();
  });

  it('should download a completed export when the action is clicked', async () => {
    jobsState.data = { items: [completedJob], totalCount: 1 };
    downloadExportFile.mockResolvedValue({ blob: new Blob(['x']), fileName: 'export.csv' });
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    const createUrl = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock');
    const revokeUrl = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

    const { user } = renderDataExchange(<ExportListPage />);
    await user.click(screen.getByRole('button', { name: 'Download' }));

    expect(downloadExportFile).toHaveBeenCalledTimes(1);
    expect(clickSpy).toHaveBeenCalled();
    expect(revokeUrl).toHaveBeenCalledWith('blob:mock');

    clickSpy.mockRestore();
    createUrl.mockRestore();
    revokeUrl.mockRestore();
  });
});
