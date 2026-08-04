import { createApiClient } from '@granit/api-client';
import { DocumentsProvider } from '@granit/react-documents';
import { createDocumentsHandlers } from '@granit/react-documents/testing';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router';

import { storyI18n } from '../stories-i18n';

import { DocumentResolutionPage } from './document-resolution-page';

import type { Meta, StoryObj } from '@storybook/react-vite';

const client = createApiClient({ baseURL: '' });
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

const meta: Meta<typeof DocumentResolutionPage> = {
  title: 'Documents/DocumentResolutionPage',
  component: DocumentResolutionPage,
  tags: ['autodocs', '!test'],
  parameters: {
    layout: 'fullscreen',
    msw: { handlers: createDocumentsHandlers() },
  },
  decorators: [
    (Story) => (
      <I18nextProvider i18n={storyI18n}>
        <QueryClientProvider client={queryClient}>
          <DocumentsProvider config={{ client }}>
            <MemoryRouter initialEntries={['/documents/resolution']}>
              <div className="p-6">
                <Story />
              </div>
            </MemoryRouter>
          </DocumentsProvider>
        </QueryClientProvider>
      </I18nextProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

/** Batch document-ID → presigned-URL resolver wired to the mock `/resolution/resolve` endpoint. */
export const Default: Story = {};
