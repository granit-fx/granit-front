import { mockBackgroundJobs } from '@granit/react-background-jobs/testing';
import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { JobCard } from '../components/job-card';

import { renderBackgroundJobs } from './test-utils';

import type { BackgroundJobStatus } from '@granit/background-jobs';

// JobCard renders JobActions, which consumes the @granit/react-background-jobs
// mutation hooks. Stub them so the card mounts without a real data layer.
vi.mock('@granit/react-background-jobs', () => ({
  usePauseJob: () => ({ mutate: vi.fn(), isPending: false }),
  useResumeJob: () => ({ mutate: vi.fn(), isPending: false }),
  useTriggerJob: () => ({ mutate: vi.fn(), isPending: false }),
}));

function makeJob(overrides: Partial<BackgroundJobStatus> = {}): BackgroundJobStatus {
  return {
    ...mockBackgroundJobs[0],
    ...overrides,
  };
}

describe('JobCard', () => {
  it('renders the job name and a humanised cron expression', () => {
    renderBackgroundJobs(<JobCard job={makeJob()} />);
    expect(screen.getByText('vault-credential-renewal')).toBeInTheDocument();
    expect(document.querySelector('[data-slot="job-card"]')).toBeInTheDocument();
  });

  it('shows "Never" / "Not scheduled" when timestamps are null', () => {
    renderBackgroundJobs(
      <JobCard job={makeJob({ lastExecutedAt: null, nextExecutionAt: null })} />
    );
    expect(screen.getByText('Never')).toBeInTheDocument();
    expect(screen.getByText('Not scheduled')).toBeInTheDocument();
  });

  it('renders the failure panel with the last error when failing', () => {
    renderBackgroundJobs(
      <JobCard job={makeJob({ consecutiveFailures: 2, lastError: 'Connection refused' })} />
    );
    expect(screen.getByText('2 consecutive failures')).toBeInTheDocument();
    expect(screen.getByText('Connection refused')).toBeInTheDocument();
  });

  it('renders the failure panel without an error line when lastError is null', () => {
    renderBackgroundJobs(<JobCard job={makeJob({ consecutiveFailures: 1, lastError: null })} />);
    expect(screen.getByText('1 consecutive failure')).toBeInTheDocument();
  });

  it('renders the dead-letter panel when dead letters exist', () => {
    renderBackgroundJobs(<JobCard job={makeJob({ deadLetterCount: 3 })} />);
    expect(screen.getByText('3 dead-letter messages')).toBeInTheDocument();
  });

  it('applies the dimmed style for a disabled job', () => {
    renderBackgroundJobs(<JobCard job={makeJob({ isEnabled: false })} />);
    const card = document.querySelector('[data-slot="job-card"]') as HTMLElement;
    expect(card.className).toContain('opacity-70');
  });

  it('applies the destructive border for a failing job', () => {
    renderBackgroundJobs(<JobCard job={makeJob({ consecutiveFailures: 4 })} />);
    const card = document.querySelector('[data-slot="job-card"]') as HTMLElement;
    expect(card.className).toContain('border-destructive/50');
  });
});
