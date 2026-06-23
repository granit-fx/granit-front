import { createApiClient } from '@granit/api-client';
import { TemplatingProvider } from '@granit/react-templating';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { TEMPLATING_CONFIG } from '../constants';

import { VariablePanel } from './variable-panel';

import type { Meta, StoryObj } from '@storybook/react-vite';

const storyClient = createApiClient({ baseURL: '' });

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const meta: Meta<typeof VariablePanel> = {
  title: 'Features/Templates/VariablePanel',
  component: VariablePanel,
  tags: ['autodocs'],
  argTypes: {
    onInsert: { action: 'onInsert' },
  },
  args: {
    onInsert: () => {},
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
  },
};

export const WithClassName: Story = {
  args: {
    templateName: 'Billing.Invoice',
    className: 'max-h-[400px]',
  },
};
