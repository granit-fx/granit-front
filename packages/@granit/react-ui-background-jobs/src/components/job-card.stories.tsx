import { createApiClient } from '@granit/api-client';
import { BackgroundJobsProvider } from '@granit/react-background-jobs';
import { mockBackgroundJobs } from '@granit/react-background-jobs/testing';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { JobCard } from './job-card';

import type { Meta, StoryObj } from '@storybook/react-vite';

const client = createApiClient({ baseURL: '' });
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

const meta: Meta<typeof JobCard> = {
  title: 'BackgroundJobs/JobCard',
  component: JobCard,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <BackgroundJobsProvider config={{ client }}>
          <div className="w-96">
            <Story />
          </div>
        </BackgroundJobsProvider>
      </QueryClientProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

/** A healthy, scheduled job. */
export const Healthy: Story = {
  args: { job: mockBackgroundJobs[0] },
};

/** A failing job — consecutive failures and a dead-letter count surface inline. */
export const Failing: Story = {
  args: { job: mockBackgroundJobs[2] },
};

/** A disabled job renders dimmed with no next execution. */
export const Disabled: Story = {
  args: { job: mockBackgroundJobs[3] },
};
