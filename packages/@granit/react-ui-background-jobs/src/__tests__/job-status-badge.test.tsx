import { toISODateString } from '@granit/types';
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { JobStatusBadge } from '../components/job-status-badge';

import { renderBackgroundJobs } from './test-utils';

import type { BackgroundJobStatus } from '@granit/background-jobs';

function makeJob(overrides: Partial<BackgroundJobStatus> = {}): BackgroundJobStatus {
  return {
    jobName: 'SampleJob',
    cronExpression: '0 0 * * * ?',
    isEnabled: true,
    lastExecutedAt: toISODateString('2026-04-02T12:00:00Z'),
    nextExecutionAt: toISODateString('2026-04-02T13:00:00Z'),
    consecutiveFailures: 0,
    deadLetterCount: 0,
    lastError: null,
    ...overrides,
  };
}

describe('JobStatusBadge', () => {
  it('renders the Paused badge when the job is disabled', () => {
    renderBackgroundJobs(<JobStatusBadge job={makeJob({ isEnabled: false })} />);
    expect(screen.getByText('Paused')).toBeInTheDocument();
  });

  it('renders the Failing badge when enabled with consecutive failures', () => {
    renderBackgroundJobs(
      <JobStatusBadge job={makeJob({ isEnabled: true, consecutiveFailures: 3 })} />
    );
    expect(screen.getByText('Failing')).toBeInTheDocument();
  });

  it('renders the Active badge when enabled and healthy', () => {
    renderBackgroundJobs(
      <JobStatusBadge job={makeJob({ isEnabled: true, consecutiveFailures: 0 })} />
    );
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('prioritises Paused over Failing when disabled and failing', () => {
    renderBackgroundJobs(
      <JobStatusBadge job={makeJob({ isEnabled: false, consecutiveFailures: 5 })} />
    );
    expect(screen.getByText('Paused')).toBeInTheDocument();
    expect(screen.queryByText('Failing')).not.toBeInTheDocument();
  });
});
