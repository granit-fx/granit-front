import { createApiClient } from '@granit/api-client';
import { DocumentsProvider } from '@granit/react-documents';
import { createDocumentsHandlers, DOC_NDA_ID } from '@granit/react-documents/testing';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { DocumentPropertiesPage } from './document-properties-page';
import { storyI18n } from './stories-i18n';

import type { Meta, StoryObj } from '@storybook/react-vite';

const client = createApiClient({ baseURL: '' });
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

const meta: Meta<typeof DocumentPropertiesPage> = {
  title: 'Documents/DocumentPropertiesPage',
  component: DocumentPropertiesPage,
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
            <MemoryRouter initialEntries={[`/documents/${DOC_NDA_ID}/metadata`]}>
              <div className="p-6">
                <Routes>
                  <Route path="/documents/:id/metadata" element={<Story />} />
                </Routes>
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

/** Extracted metadata for the NDA fixture document, served by the mock `/documents/{id}/metadata` endpoint. */
export const Default: Story = {};
