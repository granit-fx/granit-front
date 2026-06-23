import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { toReactionEmoji } from '@granit/timeline';
import { toEntityId } from '@granit/types';

import { ReactionStrip } from './reaction-strip';

import type { ReactionMap, TimelineEntryId } from '@granit/timeline';

const entryId = toEntityId<'TimelineStreamEntryResponse'>('tl-1') as TimelineEntryId;

const THUMBS_UP = toReactionEmoji('👍');
const PARTY = toReactionEmoji('🎉');
const HEART = toReactionEmoji('❤️');

const reactionsWithMix: ReactionMap = {
  [THUMBS_UP]: { count: 3, displayEmoji: THUMBS_UP, byCurrentUser: true },
  [PARTY]: { count: 1, displayEmoji: PARTY, byCurrentUser: false },
  [HEART]: { count: 2, displayEmoji: HEART, byCurrentUser: false },
};

const reactionsSingle: ReactionMap = {
  [THUMBS_UP]: { count: 1, displayEmoji: THUMBS_UP, byCurrentUser: true },
};

const meta = {
  title: 'Timeline/ReactionStrip',
  component: ReactionStrip,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  args: {
    entryId,
    onToggle: fn(),
  },
} satisfies Meta<typeof ReactionStrip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: 'Interactive — multiple reactions',
  args: {
    reactions: reactionsWithMix,
  },
};

export const SingleReaction: Story = {
  name: 'Interactive — single reaction',
  args: {
    reactions: reactionsSingle,
  },
};

export const NoReactionsInteractive: Story = {
  name: 'Interactive — no reactions yet (shows picker only)',
  args: {
    reactions: {},
  },
};

export const ReadOnly: Story = {
  name: 'Read-only — multiple reactions',
  args: {
    reactions: reactionsWithMix,
    onToggle: undefined,
  },
};

export const ReadOnlyEmpty: Story = {
  name: 'Read-only — empty (renders nothing)',
  args: {
    reactions: {},
    onToggle: undefined,
  },
  parameters: {
    docs: {
      description: {
        story:
          'When read-only and there are no reactions, the component returns null and renders nothing.',
      },
    },
  },
};
