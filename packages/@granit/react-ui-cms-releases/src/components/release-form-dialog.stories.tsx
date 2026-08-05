import { createApiClient } from '@granit/api-client';
import { CmsProvider } from '@granit/react-cms';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fn } from 'storybook/test';

import { ReleaseFormDialog } from './release-form-dialog';

import type { Meta, StoryObj } from '@storybook/react-vite';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

const client = createApiClient({ baseURL: '' });

const meta: Meta<typeof ReleaseFormDialog> = {
  title: 'CMS Releases/ReleaseFormDialog',
  component: ReleaseFormDialog,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <CmsProvider config={{ client, basePath: '/api/cms' }}>
          <Story />
        </CmsProvider>
      </QueryClientProvider>
    ),
  ],
  args: {
    open: true,
    onOpenChange: fn(),
  },
  argTypes: {
    open: { control: 'boolean' },
    onOpenChange: { action: 'onOpenChange' },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/** Create a new release — only the name is required; scheduling is optional. */
export const Default: Story = {};
