import { WebhookSecretDisplay } from './webhook-secret-display';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof WebhookSecretDisplay> = {
  title: 'Features/Webhooks/WebhookSecretDisplay',
  component: WebhookSecretDisplay,
  tags: ['autodocs'],
  argTypes: {
    onRotate: { action: 'onRotate' },
  },
  args: {
    secret: 'whsec_test-placeholder-not-a-real-secret', // gitleaks:allow
    targetUrl: 'https://example.com/webhook',
    onRotate: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const OneTime: Story = {
  args: { isOneTime: true, onRotate: undefined },
};

export const Rotating: Story = {
  args: { isRotating: true },
};

export const WithoutTargetUrl: Story = {
  args: { targetUrl: undefined },
};
