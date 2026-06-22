import { fn } from 'storybook/test';

import { ValidateTaxForm } from './validate-tax-form';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof ValidateTaxForm> = {
  title: 'Tax/ValidateTaxForm',
  component: ValidateTaxForm,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: {
    onSubmit: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Pending: Story = {
  args: { isPending: true },
};
