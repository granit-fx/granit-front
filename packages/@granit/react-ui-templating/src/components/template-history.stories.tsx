import { createApiClient } from '@granit/api-client';
import { TemplatingProvider } from '@granit/react-templating';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { TEMPLATING_CONFIG } from '../constants';

import { TemplateHistory } from './template-history';

import type { Meta, StoryObj } from '@storybook/react-vite';

const storyClient = createApiClient({ baseURL: '' });

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const meta: Meta<typeof TemplateHistory> = {
  title: 'Features/Templates/TemplateHistory',
  component: TemplateHistory,
  tags: ['autodocs'],
  argTypes: {
    onCompare: { action: 'onCompare' },
  },
  args: {
    onCompare: () => {},
  },
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <TemplatingProvider config={{ ...TEMPLATING_CONFIG, client: storyClient }}>
          <Story />
        </TemplatingProvider>
      </QueryClientProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    templateName: 'Billing.Invoice',
    culture: 'fr',
  },
};

export const NoCulture: Story = {
  args: {
    templateName: 'Notifications.Welcome',
  },
};
