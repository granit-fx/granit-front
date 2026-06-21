import { fn } from 'storybook/test';

import { ViewSwitcher } from './view-switcher';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta = {
  title: 'Admin Kit/ViewSwitcher',
  component: ViewSwitcher,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  args: {
    onViewChange: fn(),
  },
} satisfies Meta<typeof ViewSwitcher>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ListView: Story = {
  args: {
    view: 'list',
  },
};

export const KanbanView: Story = {
  args: {
    view: 'kanban',
  },
};
