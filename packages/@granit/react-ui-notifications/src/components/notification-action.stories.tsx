import { MemoryRouter } from 'react-router-dom';

import { NotificationAction } from './notification-action';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof NotificationAction> = {
  title: 'Notifications/NotificationAction',
  component: NotificationAction,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <MemoryRouter>
        <div className="p-8">
          <Story />
        </div>
      </MemoryRouter>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const InternalRoute: Story = {
  args: {
    action: { label: 'View activity', to: '/activities?activityId=42' },
  },
};

export const ExternalUrl: Story = {
  args: {
    action: { label: 'Open dashboard', to: 'https://example.com/dashboard' },
  },
};
