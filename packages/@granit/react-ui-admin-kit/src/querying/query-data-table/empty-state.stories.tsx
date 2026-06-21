import { EmptyState } from './empty-state';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta = {
  title: 'Admin Kit/EmptyState',
  component: EmptyState,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof EmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithCustomMessage: Story = {
  args: {
    message: 'No users found matching your search criteria.',
  },
};
