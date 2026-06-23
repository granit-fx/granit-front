import { TestDataManager } from './test-data-manager';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof TestDataManager> = {
  title: 'Features/Templates/TestDataManager',
  component: TestDataManager,
  tags: ['autodocs'],
  argTypes: {
    onLoad: { action: 'onLoad' },
  },
  args: {
    templateName: 'Billing.Invoice',
    currentData: '{ "title": "Test" }',
    onLoad: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
