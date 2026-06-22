import { fn } from 'storybook/test';

import { MeterForm } from './meter-form';

import type { MeterDefinitionResponse } from '@granit/metering';
import type { Meta, StoryObj } from '@storybook/react-vite';

const existingMeter: MeterDefinitionResponse = {
  id: '44444444-4444-4444-4444-444444444444',
  name: 'API Calls',
  unit: 'calls',
  description: 'Counts inbound API requests per tenant.',
  aggregationType: 'Count',
  productId: null,
  lifecycleStatus: 'Published',
  distinctProperty: null,
};

const meta: Meta<typeof MeterForm> = {
  title: 'Metering/MeterForm',
  component: MeterForm,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: {
    onCancel: fn(),
    onSubmit: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Create: Story = {
  args: { mode: 'create' },
};

export const Edit: Story = {
  args: { mode: 'edit', defaultValues: existingMeter },
};

export const Pending: Story = {
  args: { mode: 'create', isPending: true },
};
