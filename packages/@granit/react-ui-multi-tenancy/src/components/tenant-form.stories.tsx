import { fn } from 'storybook/test';

import { TenantForm } from './tenant-form';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof TenantForm> = {
  title: 'Features/Tenants/TenantForm',
  component: TenantForm,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: {
    onSubmit: fn(),
    onCancel: fn(),
    isSubmitting: false,
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Create: Story = {
  args: { mode: 'create' },
};

export const Edit: Story = {
  args: {
    mode: 'edit',
    readOnlyIdentifier: 'acme-corp',
    defaultValues: {
      name: 'Acme Corp',
      contactEmail: 'admin@acme.example',
      jurisdiction: 'FR',
    },
  },
};

export const Submitting: Story = {
  args: { mode: 'create', isSubmitting: true },
};
