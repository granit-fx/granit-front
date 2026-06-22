import { createApiClient } from '@granit/api-client';
import { CmsRedirectsProvider } from '@granit/react-cms-redirects';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fn } from 'storybook/test';

import { RedirectFormDialog } from './redirect-form-dialog';

import type { RedirectResponse } from '@granit/react-cms-redirects';
import type { Meta, StoryObj } from '@storybook/react-vite';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

const client = createApiClient({ baseURL: '' });

const sampleRedirect: RedirectResponse = {
  id: 'redirect-001',
  siteId: 'site-001',
  source: '/old-blog',
  matchType: 'Exact',
  target: '/news',
  type: 'MovedPermanently',
  statusCode: 301,
  isActive: true,
  culture: 'en-GB',
  origin: 'Manual',
  hitCount: 42,
  lastHitAt: '2026-06-18T10:30:00Z',
};

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
