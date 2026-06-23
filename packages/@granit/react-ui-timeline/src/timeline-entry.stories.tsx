import { TimelineProvider } from '@granit/react-timeline';
import { createTimelineHandlers } from '@granit/react-timeline/testing';
import { TimelineEntryType } from '@granit/timeline';
import type { ReactionEmoji, TimelineStreamEntryResponse } from '@granit/timeline';
import { toEntityId, toISODateString } from '@granit/types';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fn } from 'storybook/test';

import type { Meta, StoryObj } from '@storybook/react-vite';

import { createApiClient } from '@granit/api-client';

import { TimelineStreamEntryResponse as TimelineEntryComponent } from './timeline-entry';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

const storyTimelineConfig = { client: createApiClient({ baseURL: '' }), basePath: '/api/v1/timeline' };

const commentEntry: TimelineStreamEntryResponse = {
  id: toEntityId<'TimelineStreamEntryResponse'>('tl-1'),
  entryType: TimelineEntryType.Comment,
  body: 'Account created and initial roles assigned. Please review and confirm.',
  authorId: toEntityId<'User'>('admin-001'),
  authorName: 'System Admin',
  parentEntryId: null,
  occurredAt: toISODateString('2026-05-10T09:30:00Z'),
  attachments: [],
};

const internalNoteEntry: TimelineStreamEntryResponse = {
  id: toEntityId<'TimelineStreamEntryResponse'>('tl-2'),
  entryType: TimelineEntryType.InternalNote,
  body: 'Reviewed user access — confirmed granit-showcase-admin role required for project onboarding.',
  authorId: toEntityId<'User'>('admin-002'),
  authorName: 'Security Officer',
  parentEntryId: null,
  occurredAt: toISODateString('2026-06-01T14:15:00Z'),
  attachments: [],
};

const systemLogEntry: TimelineStreamEntryResponse = {
  id: toEntityId<'TimelineStreamEntryResponse'>('tl-3'),
  entryType: TimelineEntryType.SystemLog,
  body: 'Role granit-showcase-readonly removed by admin.',
  authorId: toEntityId<'User'>('system'),
  authorName: 'System',
  parentEntryId: null,
  occurredAt: toISODateString('2026-06-05T11:00:00Z'),
  attachments: [],
};

const editedEntry: TimelineStreamEntryResponse = {
  id: toEntityId<'TimelineStreamEntryResponse'>('tl-4'),
  entryType: TimelineEntryType.Comment,
  body: 'This comment was updated after the initial submission.',
  authorId: toEntityId<'User'>('admin-001'),
  authorName: 'System Admin',
  parentEntryId: null,
  occurredAt: toISODateString('2026-05-20T10:00:00Z'),
  editedAt: toISODateString('2026-05-20T10:45:00Z'),
  attachments: [],
};

const entryWithReactions: TimelineStreamEntryResponse = {
  id: toEntityId<'TimelineStreamEntryResponse'>('tl-5'),
  entryType: TimelineEntryType.Comment,
  body: 'Great progress on this feature! The implementation looks solid.',
  authorId: toEntityId<'User'>('admin-003'),
  authorName: 'Jane Dupont',
  parentEntryId: null,
  occurredAt: toISODateString('2026-06-07T08:00:00Z'),
  attachments: [],
  reactions: {
    ['👍' as ReactionEmoji]: { count: 3, byCurrentUser: true, displayEmoji: '👍' },
    ['🎉' as ReactionEmoji]: { count: 1, byCurrentUser: false, displayEmoji: '🎉' },
  },
};

const meta: Meta<typeof TimelineEntryComponent> = {
  title: 'Timeline/TimelineEntry',
  component: TimelineEntryComponent,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  argTypes: {
    depth: { control: { type: 'range', min: 0, max: 4, step: 1 } },
    canReact: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof TimelineEntryComponent>;

export const Default: Story = {
  args: {
    entry: commentEntry,
    onReply: fn(),
    onEdit: fn(),
    onDelete: fn(),
  },
};

export const InternalNote: Story = {
  args: {
    entry: internalNoteEntry,
    onReply: fn(),
    onDelete: fn(),
  },
};

export const SystemLog: Story = {
  args: {
    entry: systemLogEntry,
  },
};

export const Edited: Story = {
  args: {
    entry: editedEntry,
    onReply: fn(),
    onEdit: fn(),
    onDelete: fn(),
  },
};

export const WithReactions: Story = {
  args: {
    entry: entryWithReactions,
    onReply: fn(),
  },
};

export const NestedReply: Story = {
  args: {
    entry: {
      ...commentEntry,
      id: toEntityId<'TimelineStreamEntryResponse'>('tl-nested'),
      body: 'This is a nested reply to the original comment.',
      authorName: 'Jane Dupont',
      authorId: toEntityId<'User'>('user-042'),
    },
    depth: 2,
    onReply: fn(),
    onDelete: fn(),
  },
};

export const InteractiveReactions: Story = {
  parameters: {
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
  args: {
    entry: entryWithReactions,
    entityType: 'User',
    entityId: 'user-001',
    canReact: true,
    onReply: fn(),
    onReactionToggled: fn(),
  },
};

export const ReadOnlyNoActions: Story = {
  args: {
    entry: commentEntry,
  },
};
