import { fn } from 'storybook/test';

import { PartyCreateForm } from './party-create-form';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof PartyCreateForm> = {
  title: 'Features/Parties/PartyCreateForm',
  component: PartyCreateForm,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: {
    onSubmit: fn(),
    onCancel: fn(),
    isPending: false,
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Submitting: Story = {
  args: { isPending: true },
};
