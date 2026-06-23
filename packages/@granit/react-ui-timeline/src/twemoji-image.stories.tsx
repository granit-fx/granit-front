import { TwemojiImage } from './twemoji-image';

import type { Meta, StoryObj } from '@storybook/react-vite';


const meta = {
  title: 'Timeline/TwemojiImage',
  component: TwemojiImage,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof TwemojiImage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    emoji: '👍',
    size: 18,
  },
};

export const Large: Story = {
  args: {
    emoji: '🎉',
    size: 48,
  },
};

export const SkinToneModifier: Story = {
  args: {
    emoji: '👍🏽',
    size: 32,
  },
};

export const ZwjSequence: Story = {
  args: {
    emoji: '👨‍👩‍👧',
    size: 32,
  },
};

export const KeycapSequence: Story = {
  args: {
    emoji: '1️⃣',
    size: 24,
  },
};

export const EmojiStrip: Story = {
  args: { emoji: '👍' },
  render: () => (
    <div className="flex items-center gap-2">
      {['👍', '❤️', '😂', '😮', '😢', '🎉', '🔥', '✅'].map((emoji) => (
        <TwemojiImage key={emoji} emoji={emoji} size={24} />
      ))}
    </div>
  ),
};
