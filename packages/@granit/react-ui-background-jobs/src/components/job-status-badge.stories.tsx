import { JobStatusBadge } from './job-status-badge';

import type { BackgroundJobStatus } from '@granit/background-jobs';
import type { Meta, StoryObj } from '@storybook/react-vite';

const baseJob: BackgroundJobStatus = {
  jobName: 'invoice-reminder-dispatch',
  cronExpression: '0 */15 * * * *',
  isEnabled: true,
  lastExecutedAt: '2026-06-21T09:45:00Z',
  nextExecutionAt: '2026-06-21T10:00:00Z',
  consecutiveFailures: 0,
  deadLetterCount: 0,
  lastError: null,
};

const activeJob: BackgroundJobStatus = baseJob;

const failingJob: BackgroundJobStatus = {
  ...baseJob,
  jobName: 'webhook-delivery-retry',
  consecutiveFailures: 3,
  deadLetterCount: 2,
  lastError: 'Connection timed out after 30s',
};

const pausedJob: BackgroundJobStatus = {
  ...baseJob,
  jobName: 'nightly-data-export',
  cronExpression: '0 0 2 * * *',
  isEnabled: false,
  nextExecutionAt: null,
};

const meta: Meta<typeof JobStatusBadge> = {
  title: 'BackgroundJobs/JobStatusBadge',
  component: JobStatusBadge,
  tags: ['autodocs'],
  argTypes: {
    job: {
      control: 'object',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Active: Story = { args: { job: activeJob } };
export const Failing: Story = { args: { job: failingJob } };
export const Paused: Story = { args: { job: pausedJob } };

export const All: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <JobStatusBadge job={activeJob} />
      <JobStatusBadge job={failingJob} />
      <JobStatusBadge job={pausedJob} />
    </div>
  ),
};
