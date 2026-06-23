import { fn } from 'storybook/test';

import { UserStatusToggle } from './user-status-toggle';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof UserStatusToggle> = {
  title: 'Identity/UserStatusToggle',
  component: UserStatusToggle,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    enabled: { control: 'boolean' },
    disabled: { control: 'boolean' },
    onToggle: { action: 'onToggle' },
  },
  args: { onToggle: fn() },
};

export default meta;
type Story = StoryObj<typeof UserStatusToggle>;

export const Enabled: Story = {
  args: { enabled: true },
};

export const Disabled: Story = {
  args: { enabled: false },
};

export const ReadOnly: Story = {
  args: { enabled: true, disabled: true },
};
