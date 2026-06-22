import { fn } from 'storybook/test';

import { AutoRefreshIndicator } from './auto-refresh-indicator';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof AutoRefreshIndicator> = {
  title: 'Diagnostics/AutoRefreshIndicator',
  component: AutoRefreshIndicator,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  argTypes: {
    onRefresh: { action: 'onRefresh' },
    isRefreshing: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof AutoRefreshIndicator>;

export const Default: Story = {
  args: {
    onRefresh: fn(),
    isRefreshing: false,
  },
};

export const Refreshing: Story = {
  args: {
    onRefresh: fn(),
    isRefreshing: true,
  },
};
