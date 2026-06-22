import { createApiClient } from '@granit/api-client';
import { BackgroundJobsProvider } from '@granit/react-background-jobs';
import { mockBackgroundJobs } from '@granit/react-background-jobs/testing';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { JobActions } from './job-actions';

import type { Meta, StoryObj } from '@storybook/react-vite';

const client = createApiClient({ baseURL: '' });
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

const meta: Meta<typeof JobActions> = {
  title: 'BackgroundJobs/JobActions',
  component: JobActions,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <BackgroundJobsProvider config={{ client }}>
          <Story />
        </BackgroundJobsProvider>
      </QueryClientProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

/** An enabled job exposes Pause + Trigger. */
export const Enabled: Story = {
  args: { job: mockBackgroundJobs[0] },
};

/** A disabled job exposes Resume; Trigger is disabled until re-enabled. */
export const Disabled: Story = {
  args: { job: { ...mockBackgroundJobs[0], isEnabled: false } },
};
