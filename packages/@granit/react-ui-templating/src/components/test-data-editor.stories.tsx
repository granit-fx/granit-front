import { TestDataEditor } from './test-data-editor';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof TestDataEditor> = {
  title: 'Features/Templates/TestDataEditor',
  component: TestDataEditor,
  tags: ['autodocs'],
  argTypes: {
    onChange: { action: 'onChange' },
  },
  args: {
    value: '{\n  "title": "Facture",\n  "amount": 150.00\n}',
    onChange: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Empty: Story = {
  args: {
    value: '',
  },
};

export const InvalidJson: Story = {
  args: {
    value: '{ invalid json }',
  },
};
