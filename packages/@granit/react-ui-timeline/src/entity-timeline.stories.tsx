import { createApiClient } from '@granit/api-client';
import { TimelineProvider } from '@granit/react-timeline';
import { createTimelineHandlers } from '@granit/react-timeline/testing';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { EntityTimeline } from './entity-timeline';

import type { Meta, StoryObj } from '@storybook/react-vite';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

const storyTimelineConfig = { client: createApiClient({ baseURL: '' }), basePath: '/api/v1/timeline' };

const meta: Meta<typeof EntityTimeline> = {
  title: 'Timeline/EntityTimeline',
  component: EntityTimeline,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    msw: {
      handlers: createTimelineHandlers(),
    },
  },
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <TimelineProvider config={storyTimelineConfig}>
          <Story />
        </TimelineProvider>
      </QueryClientProvider>
    ),
  ],
  argTypes: {
    entityType: { control: 'text' },
    entityId: { control: 'text' },
    pageSize: { control: 'number' },
  },
};

export default meta;
type Story = StoryObj<typeof EntityTimeline>;

export const Default: Story = {
  args: {
    entityType: 'User',
    entityId: 'user-001',
  },
};

export const CustomPageSize: Story = {
  args: {
    entityType: 'User',
    entityId: 'user-001',
    pageSize: 10,
  },
};
