import { toISODateString } from '@granit/types';
import { within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { JobActions } from '../components/job-actions';

import { renderBackgroundJobs } from './test-utils';

import type { BackgroundJobStatus } from '@granit/background-jobs';

const pauseMutate = vi.fn();
const resumeMutate = vi.fn();
const triggerMutate = vi.fn();
const pending = { pause: false, resume: false, trigger: false };

vi.mock('@granit/react-background-jobs', () => ({
  usePauseJob: () => ({ mutate: pauseMutate, isPending: pending.pause }),
  useResumeJob: () => ({ mutate: resumeMutate, isPending: pending.resume }),
  useTriggerJob: () => ({ mutate: triggerMutate, isPending: pending.trigger }),
}));

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

describe('JobActions', () => {
  beforeEach(() => {
    pauseMutate.mockClear();
    resumeMutate.mockClear();
    triggerMutate.mockClear();
    pending.pause = false;
    pending.resume = false;
    pending.trigger = false;
  });

  it('shows the pause control for an enabled job and pauses on click', async () => {
    const { user } = renderBackgroundJobs(<JobActions job={makeJob({ isEnabled: true })} />);
    const container = document.querySelector('[data-slot="job-actions"]') as HTMLElement;
    const buttons = within(container).getAllByRole('button');
    // First button is pause (enabled), second is trigger.
    await user.click(buttons[0]);
    expect(pauseMutate).toHaveBeenCalledWith('SampleJob');
    expect(resumeMutate).not.toHaveBeenCalled();
  });

  it('shows the resume control for a disabled job and resumes on click', async () => {
    const { user } = renderBackgroundJobs(<JobActions job={makeJob({ isEnabled: false })} />);
    const container = document.querySelector('[data-slot="job-actions"]') as HTMLElement;
    const buttons = within(container).getAllByRole('button');
    await user.click(buttons[0]);
    expect(resumeMutate).toHaveBeenCalledWith('SampleJob');
    expect(pauseMutate).not.toHaveBeenCalled();
  });

  it('triggers the job when the trigger button is clicked', async () => {
    const { user } = renderBackgroundJobs(<JobActions job={makeJob({ isEnabled: true })} />);
    const container = document.querySelector('[data-slot="job-actions"]') as HTMLElement;
    const buttons = within(container).getAllByRole('button');
    await user.click(buttons[1]);
    expect(triggerMutate).toHaveBeenCalledWith('SampleJob');
  });

  it('disables the trigger button for a disabled job', () => {
    renderBackgroundJobs(<JobActions job={makeJob({ isEnabled: false })} />);
    const container = document.querySelector('[data-slot="job-actions"]') as HTMLElement;
    const buttons = within(container).getAllByRole('button');
    // Second button is the trigger; disabled because the job is not enabled.
    expect(buttons[1]).toBeDisabled();
  });

  it('disables all controls while a mutation is pending', () => {
    pending.pause = true;
    renderBackgroundJobs(<JobActions job={makeJob({ isEnabled: true })} />);
    const container = document.querySelector('[data-slot="job-actions"]') as HTMLElement;
    const buttons = within(container).getAllByRole('button');
    for (const button of buttons) {
      expect(button).toBeDisabled();
    }
  });
});
