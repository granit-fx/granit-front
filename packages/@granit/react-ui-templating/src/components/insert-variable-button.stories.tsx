import { createApiClient } from '@granit/api-client';
import { TemplatingProvider } from '@granit/react-templating';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fn } from 'storybook/test';

import { TEMPLATING_CONFIG } from '../constants';

import { InsertVariableButton } from './insert-variable-button';

import type { Meta, StoryObj } from '@storybook/react-vite';

const storyClient = createApiClient({ baseURL: '' });

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const meta: Meta<typeof InsertVariableButton> = {
  title: 'Features/Templates/InsertVariableButton',
  component: InsertVariableButton,
  tags: ['autodocs'],
  args: {
    templateName: 'Billing.Invoice',
    onInsert: fn(),
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

export const Default: Story = {};
