import { mockBackgroundJobs } from '@granit/react-background-jobs/testing';
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
    ...mockBackgroundJobs[0],
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
    expect(pauseMutate).toHaveBeenCalledWith('vault-credential-renewal');
    expect(resumeMutate).not.toHaveBeenCalled();
  });

  it('shows the resume control for a disabled job and resumes on click', async () => {
    const { user } = renderBackgroundJobs(<JobActions job={makeJob({ isEnabled: false })} />);
    const container = document.querySelector('[data-slot="job-actions"]') as HTMLElement;
    const buttons = within(container).getAllByRole('button');
    await user.click(buttons[0]);
    expect(resumeMutate).toHaveBeenCalledWith('vault-credential-renewal');
    expect(pauseMutate).not.toHaveBeenCalled();
  });

  it('triggers the job when the trigger button is clicked', async () => {
    const { user } = renderBackgroundJobs(<JobActions job={makeJob({ isEnabled: true })} />);
    const container = document.querySelector('[data-slot="job-actions"]') as HTMLElement;
    const buttons = within(container).getAllByRole('button');
    await user.click(buttons[1]);
    expect(triggerMutate).toHaveBeenCalledWith('vault-credential-renewal');
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
