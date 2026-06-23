import { createApiClient } from '@granit/api-client';
import { PrivacyProvider } from '@granit/react-privacy';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fn } from 'storybook/test';

import { LegalDocumentPublishDialog } from './legal-document-publish-dialog';

import type { Meta, StoryObj } from '@storybook/react-vite';

const client = createApiClient({ baseURL: '' });
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

const meta: Meta<typeof LegalDocumentPublishDialog> = {
  title: 'Features/Privacy/LegalDocumentPublishDialog',
  component: LegalDocumentPublishDialog,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <PrivacyProvider config={{ client, basePath: '/api/v1/privacy' }}>
          <Story />
        </PrivacyProvider>
      </QueryClientProvider>
    ),
  ],
  args: {
    documentId: 'privacy-policy',
    displayName: 'Privacy Policy',
    open: true,
    onOpenChange: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
