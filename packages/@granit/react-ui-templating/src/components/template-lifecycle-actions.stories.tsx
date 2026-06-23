import { createApiClient } from '@granit/api-client';
import { TemplatingProvider } from '@granit/react-templating';
import { TemplateLifecycleStatus } from '@granit/templating';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { TEMPLATING_CONFIG } from '../constants';

import { TemplateLifecycleActions } from './template-lifecycle-actions';

import type { TemplateDetail } from '@granit/templating';
import type { Meta, StoryObj } from '@storybook/react-vite';

const storyClient = createApiClient({ baseURL: '' });

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const meta: Meta<typeof TemplateLifecycleActions> = {
  title: 'Features/Templates/TemplateLifecycleActions',
  component: TemplateLifecycleActions,
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

const draftOnly: TemplateDetail = {
  name: 'Billing.Invoice',
  culture: 'fr',
  draft: {
    revisionId: 'rev-001',
    content: '<h1>Draft</h1>',
    mimeType: 'text/html',
    status: TemplateLifecycleStatus.Draft,
    createdAt: '2026-03-01T10:00:00Z',
    createdBy: 'admin@granit-showcase.dev',
  },
};

const published: TemplateDetail = {
  name: 'Billing.Invoice',
  culture: 'fr',
  published: {
    revisionId: 'rev-002',
    content: '<h1>Published</h1>',
    mimeType: 'text/html',
    status: TemplateLifecycleStatus.Published,
    createdAt: '2026-03-01T10:00:00Z',
    createdBy: 'admin@granit-showcase.dev',
    publishedAt: '2026-03-01T12:00:00Z',
    publishedBy: 'admin@granit-showcase.dev',
  },
};

const draftAndPublished: TemplateDetail = {
  name: 'Billing.Invoice',
  culture: 'fr',
  draft: draftOnly.draft,
  published: published.published,
};

export const DraftOnly: Story = { args: { template: draftOnly } };
export const PublishedOnly: Story = { args: { template: published } };
export const DraftAndPublished: Story = { args: { template: draftAndPublished } };
