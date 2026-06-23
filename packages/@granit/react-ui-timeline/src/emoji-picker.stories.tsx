import { fn } from 'storybook/test';

import { EmojiPicker } from './emoji-picker';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta = {
  title: 'Timeline/EmojiPicker',
  component: EmojiPicker,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  args: {
    onSelect: fn(),
    onClose: fn(),
  },
} satisfies Meta<typeof EmojiPicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: 'Default (with close callback)',
};

export const WithoutCloseCallback: Story = {
  name: 'Without close callback',
  args: {
    onClose: undefined,
  },
};
