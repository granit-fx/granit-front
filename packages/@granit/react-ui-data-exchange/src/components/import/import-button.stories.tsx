import { fn } from 'storybook/test';

import { ImportButton } from './import-button';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta = {
  title: 'DataExchange/ImportButton',
  component: ImportButton,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  args: {
    onImport: fn(),
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
} satisfies Meta<typeof ImportButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const CustomLabel: Story = {
  args: {
    label: 'Import from CSV',
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};
