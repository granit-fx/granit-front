import { WebhookDeliveryStatusBadge } from './webhook-delivery-status-badge';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof WebhookDeliveryStatusBadge> = {
  title: 'Features/Webhooks/WebhookDeliveryStatusBadge',
  component: WebhookDeliveryStatusBadge,
  tags: ['autodocs'],
  argTypes: {
    isSuccess: { control: 'boolean' },
    httpStatusCode: { control: 'number' },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Success200: Story = {
  args: { isSuccess: true, httpStatusCode: 200 },
};

export const ClientError400: Story = {
  args: { isSuccess: false, httpStatusCode: 400 },
};

export const ServerError500: Story = {
  args: { isSuccess: false, httpStatusCode: 500 },
};

export const Pending: Story = {
  args: { isSuccess: false, httpStatusCode: null },
};

export const AllStatuses: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <WebhookDeliveryStatusBadge isSuccess={true} httpStatusCode={200} />
      <WebhookDeliveryStatusBadge isSuccess={true} httpStatusCode={201} />
      <WebhookDeliveryStatusBadge isSuccess={false} httpStatusCode={400} />
      <WebhookDeliveryStatusBadge isSuccess={false} httpStatusCode={500} />
      <WebhookDeliveryStatusBadge isSuccess={false} httpStatusCode={null} />
    </div>
  ),
};
