import { fn } from 'storybook/test';

import { FileDropZone } from './file-drop-zone';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta = {
  title: 'DataExchange/FileDropZone',
  component: FileDropZone,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  args: {
    onFileSelect: fn(),
  },
} satisfies Meta<typeof FileDropZone>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const WithAcceptedFormats: Story = {
  args: {
    accept: ['.csv', '.xlsx', '.json'],
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};

export const DisabledWithAcceptedFormats: Story = {
  args: {
    disabled: true,
    accept: ['.csv', '.xlsx'],
  },
};
