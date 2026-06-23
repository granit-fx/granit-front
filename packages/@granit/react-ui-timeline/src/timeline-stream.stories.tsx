import { TimelineProvider } from '@granit/react-timeline';
import { createTimelineHandlers } from '@granit/react-timeline/testing';
import { TimelineEntryType } from '@granit/timeline';
import type { TimelineStreamEntryResponse } from '@granit/timeline';
import { toEntityId, toISODateString } from '@granit/types';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fn } from 'storybook/test';

import type { Meta, StoryObj } from '@storybook/react-vite';

import { createApiClient } from '@granit/api-client';

import { TimelineStream } from './timeline-stream';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

const storyTimelineConfig = { client: createApiClient({ baseURL: '' }), basePath: '/api/v1/timeline' };

const rootComment: TimelineStreamEntryResponse = {
  id: toEntityId<'TimelineStreamEntryResponse'>('tl-1'),
  entryType: TimelineEntryType.Comment,
  body: 'Account created and initial roles assigned. Please review and confirm.',
  authorId: toEntityId<'User'>('admin-001'),
  authorName: 'System Admin',
  parentEntryId: null,
  occurredAt: toISODateString('2026-05-10T09:30:00Z'),
  attachments: [],
};

const reply: TimelineStreamEntryResponse = {
  id: toEntityId<'TimelineStreamEntryResponse'>('tl-2'),
  entryType: TimelineEntryType.Comment,
  body: 'Confirmed — roles look correct.',
  authorId: toEntityId<'User'>('user-042'),
  authorName: 'Jane Dupont',
  parentEntryId: toEntityId<'TimelineStreamEntryResponse'>('tl-1'),
  occurredAt: toISODateString('2026-05-10T10:05:00Z'),
  attachments: [],
};

const internalNote: TimelineStreamEntryResponse = {
  id: toEntityId<'TimelineStreamEntryResponse'>('tl-3'),
  entryType: TimelineEntryType.InternalNote,
  body: 'Reviewed access — granit-showcase-admin required for onboarding.',
  authorId: toEntityId<'User'>('admin-002'),
  authorName: 'Security Officer',
  parentEntryId: null,
  occurredAt: toISODateString('2026-06-01T14:15:00Z'),
  attachments: [],
};

const entries: TimelineStreamEntryResponse[] = [rootComment, reply, internalNote];

const meta: Meta<typeof TimelineStream> = {
  title: 'Timeline/TimelineStream',
  component: TimelineStream,
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
};

export default meta;
type Story = StoryObj<typeof TimelineStream>;

export const Default: Story = {
  args: {
    entries,
    entityType: 'User',
    entityId: 'user-001',
    onReply: fn(),
  },
};

export const Loading: Story = {
  args: {
    entries: [],
    loading: true,
  },
};

export const Empty: Story = {
  args: {
    entries: [],
    emptyMessage: 'No timeline entries yet.',
  },
};

export const WithLoadMore: Story = {
  args: {
    entries,
    hasMore: true,
    onLoadMore: fn(),
    onReply: fn(),
  },
};

export const Interactive: Story = {
  args: {
    entries,
    entityType: 'User',
    entityId: 'user-001',
    canReact: true,
    onReply: fn(),
    onDelete: fn(),
    onReactionToggled: fn(),
  },
};
