import { fn } from 'storybook/test';

import { ExportButton } from './export-button';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta = {
  title: 'DataExchange/ExportButton',
  component: ExportButton,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  args: {
    onExport: fn(),
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'outline', 'secondary', 'ghost'],
    },
    size: {
      control: 'select',
      options: ['default', 'sm', 'lg', 'icon'],
    },
  },
} satisfies Meta<typeof ExportButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const CustomLabel: Story = {
  args: {
    label: 'Export to CSV',
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};
