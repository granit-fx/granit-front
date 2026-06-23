import { createApiClient } from '@granit/api-client';
import { TemplatingProvider } from '@granit/react-templating';
import { TemplateLifecycleStatus } from '@granit/templating';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { TEMPLATING_CONFIG } from '../constants';

import { TemplateDashboard } from './template-dashboard';

import type { Meta, StoryObj } from '@storybook/react-vite';

const storyClient = createApiClient({ baseURL: '' });

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const meta: Meta<typeof TemplateDashboard> = {
  title: 'Features/Templates/TemplateDashboard',
  component: TemplateDashboard,
  tags: ['autodocs'],
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
    items: [
      { status: TemplateLifecycleStatus.Draft },
      { status: TemplateLifecycleStatus.Draft },
      { status: TemplateLifecycleStatus.Published },
      { status: TemplateLifecycleStatus.Published },
      { status: TemplateLifecycleStatus.Published },
      { status: TemplateLifecycleStatus.Archived },
    ],
  },
};

export const Loading: Story = {
  args: {
    isLoading: true,
  },
};

export const Empty: Story = {
  args: {
    items: [],
  },
};
