import { createApiClient } from '@granit/api-client';
import { GranitClientProvider } from '@granit/react-api-client';

import { PushNotificationManager } from './push-notification-manager';

import type { Meta, StoryObj } from '@storybook/react-vite';

const client = createApiClient({ baseURL: '' });

const meta: Meta<typeof PushNotificationManager> = {
  title: 'Notifications/PushNotificationManager',
  component: PushNotificationManager,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <GranitClientProvider client={client}>
        <Story />
      </GranitClientProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

/** With a VAPID key, the subscribe toggle renders (browser support permitting). */
export const Default: Story = {
  args: { vapidPublicKey: 'demo-vapid-public-key' },
};

/** Without a key the manager renders nothing — web push is opt-in per deployment. */
export const NoKey: Story = {
  args: { vapidPublicKey: undefined },
};
