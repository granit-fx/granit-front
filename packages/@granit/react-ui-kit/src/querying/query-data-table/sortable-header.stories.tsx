import { fn } from 'storybook/test';

import { SortableHeader } from './sortable-header';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta = {
  title: 'Admin Kit/SortableHeader',
  component: SortableHeader,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  args: {
    onToggle: fn(),
  },
} satisfies Meta<typeof SortableHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: 'Name',
  },
};

export const SortedAscending: Story = {
  args: {
    label: 'Created At',
    direction: 'asc',
  },
};

export const SortedDescending: Story = {
  args: {
    label: 'Updated At',
    direction: 'desc',
  },
};
