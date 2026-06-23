import { fn } from 'storybook/test';

import { PlanForm } from './plan-form';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof PlanForm> = {
  title: 'Features/Subscriptions/PlanForm',
  component: PlanForm,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: {
    onSubmit: fn(),
    onCancel: fn(),
  },
  argTypes: {
    mode: { control: 'select', options: ['create', 'edit'] },
    isPending: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const CreateMode: Story = {
  args: { mode: 'create' },
};

export const EditMode: Story = {
  args: {
    mode: 'edit',
    defaultValues: {
      name: 'Professional',
      description: 'For growing businesses with advanced features',
      defaultInterval: 'Monthly',
      pricingModel: 'PerUnit',
    },
  },
};

export const Pending: Story = {
  args: { mode: 'create', isPending: true },
};
