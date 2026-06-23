import { WebhookTestButton } from './webhook-test-button';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof WebhookTestButton> = {
  title: 'Features/Webhooks/WebhookTestButton',
  component: WebhookTestButton,
  tags: ['autodocs'],
  argTypes: {
    onTest: { action: 'onTest' },
  },
  args: {
    onTest: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Pending: Story = {
  args: { isPending: true },
};

export const Success: Story = {
  args: {
    result: { success: true, httpStatusCode: 200, durationMs: 145 },
  },
};

export const Failure: Story = {
  args: {
    result: { success: false, httpStatusCode: 500, durationMs: 2031 },
  },
};
