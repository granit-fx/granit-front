import { createApiClient } from '@granit/api-client';
import { CmsRedirectsProvider } from '@granit/react-cms-redirects';
import { mockRedirects } from '@granit/react-cms-redirects/testing';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fn } from 'storybook/test';

import { RedirectFormDialog } from './redirect-form-dialog';

import type { Meta, StoryObj } from '@storybook/react-vite';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

const client = createApiClient({ baseURL: '' });

const sampleRedirect = mockRedirects[0]!;

const meta: Meta<typeof RedirectFormDialog> = {
  title: 'CMS Redirects/RedirectFormDialog',
  component: RedirectFormDialog,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <CmsRedirectsProvider config={{ client, basePath: '' }}>
          <Story />
        </CmsRedirectsProvider>
      </QueryClientProvider>
    ),
  ],
  args: {
    open: true,
    siteId: 'site-001',
    redirect: null,
    onOpenChange: fn(),
  },
  argTypes: {
    open: { control: 'boolean' },
    onOpenChange: { action: 'onOpenChange' },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Create: Story = {};

export const Edit: Story = {
  args: { redirect: sampleRedirect },
};

export const Closed: Story = {
  args: { open: false },
};
