import { screen } from '@testing-library/react';
import * as React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ImportListPage } from '../import-list-page';

import { renderDataExchange } from './test-utils';

import type { ImportJobResponse } from '@granit/data-exchange';

// The page consumes the @granit/react-data-exchange hooks directly. ImportProvider
// is stubbed to a passthrough; useGranitClient still resolves from the real
// GranitClientProvider supplied by the render helper.
const jobsState: {
  data: { items: ImportJobResponse[]; totalCount: number };
  isLoading: boolean;
} = { data: { items: [], totalCount: 0 }, isLoading: false };

vi.mock('@granit/react-data-exchange', () => ({
  ImportProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useImportJobs: () => ({
    data: jobsState.data,
    isLoading: jobsState.isLoading,
    isFetching: false,
    refetch: vi.fn(),
  }),
  useImportReport: () => ({
    report: { data: null, isLoading: false },
    downloadCorrection: vi.fn(),
  }),
}));

const importJob: ImportJobResponse = {
  id: 'i1',
  definitionName: 'Admin.UserImport',
  status: 'Completed',
  originalFileName: 'import.csv',
  createdAt: '2026-01-01T00:00:00Z',
} as ImportJobResponse;

describe('ImportListPage', () => {
  beforeEach(() => {
    jobsState.data = { items: [], totalCount: 0 };
    jobsState.isLoading = false;
  });

  it('should render the page title', () => {
    renderDataExchange(<ImportListPage />);
    expect(screen.getByRole('heading', { name: 'Import' })).toBeInTheDocument();
  });

  it('should have data-slot attribute', () => {
    renderDataExchange(<ImportListPage />);
    expect(document.querySelector('[data-slot="import-list-page"]')).toBeInTheDocument();
  });

  it('should render a spinner while loading', () => {
    jobsState.isLoading = true;
    renderDataExchange(<ImportListPage />);
    expect(document.querySelector('[data-slot="import-list-page"]')).not.toBeInTheDocument();
  });

  it('should open the report dialog when the view-report action is clicked', async () => {
    jobsState.data = { items: [importJob], totalCount: 1 };
    const { user } = renderDataExchange(<ImportListPage />);
    await user.click(screen.getByRole('button', { name: 'View report' }));
    expect(document.querySelector('[data-slot="import-report-dialog"]')).toBeInTheDocument();
  });
});
