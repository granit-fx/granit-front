import { mockBackgroundJobs } from '@granit/react-background-jobs/testing';
import { screen } from '@testing-library/react';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { BackgroundJobListPage } from '../background-job-list-page';

import { renderBackgroundJobs } from './test-utils';

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const mockJobs = mockBackgroundJobs;

// ---------------------------------------------------------------------------
// Mocks — the page consumes the @granit/react-background-jobs hooks directly
// (simple pagination, no query-engine). BackgroundJobsProvider is stubbed to a
// passthrough; useGranitClient still resolves from the real GranitClientProvider.
// ---------------------------------------------------------------------------

vi.mock('@granit/react-background-jobs', () => ({
  BackgroundJobsProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useBackgroundJobs: () => ({
    data: { items: mockJobs, totalCount: mockJobs.length },
    isLoading: false,
    isFetching: false,
    refetch: vi.fn(),
  }),
  usePauseJob: () => ({ mutate: vi.fn(), isPending: false }),
  useResumeJob: () => ({ mutate: vi.fn(), isPending: false }),
  useTriggerJob: () => ({ mutate: vi.fn(), isPending: false }),
}));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('BackgroundJobListPage', () => {
  it('should render the page title', () => {
    renderBackgroundJobs(<BackgroundJobListPage />);
    expect(screen.getByText('Background Jobs')).toBeInTheDocument();
  });

  it('should render the subtitle', () => {
    renderBackgroundJobs(<BackgroundJobListPage />);
    expect(screen.getByText('Monitor and manage recurring system tasks')).toBeInTheDocument();
  });

  it('should render refresh button', () => {
    renderBackgroundJobs(<BackgroundJobListPage />);
    expect(screen.getByText('Refresh')).toBeInTheDocument();
  });

  it('should have data-slot attribute', () => {
    renderBackgroundJobs(<BackgroundJobListPage />);
    expect(document.querySelector('[data-slot="background-job-list-page"]')).toBeInTheDocument();
  });
});
