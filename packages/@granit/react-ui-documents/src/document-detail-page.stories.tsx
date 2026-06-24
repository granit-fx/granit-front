import { createApiClient } from '@granit/api-client';
import { AuthorizationProvider } from '@granit/react-authorization';
import { DocumentsProvider } from '@granit/react-documents';
import { createDocumentsHandlers, DOC_NDA_ID } from '@granit/react-documents/testing';
import { TaxonomyProvider } from '@granit/react-taxonomy';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { DocumentDetailPage } from './document-detail-page';
import { storyI18n } from './stories-i18n';

import type { Meta, StoryObj } from '@storybook/react-vite';

const client = createApiClient({ baseURL: '' });
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

const meta: Meta<typeof DocumentDetailPage> = {
  title: 'Documents/DocumentDetailPage',
  component: DocumentDetailPage,
  tags: ['autodocs', '!test'],
  parameters: {
    layout: 'fullscreen',
    msw: { handlers: createDocumentsHandlers() },
  },
  decorators: [
    (Story) => (
      <I18nextProvider i18n={storyI18n}>
        <QueryClientProvider client={queryClient}>
          <AuthorizationProvider config={{ client }}>
            <DocumentsProvider config={{ client }}>
              <TaxonomyProvider config={{ client }}>
                <MemoryRouter initialEntries={[`/documents/${DOC_NDA_ID}`]}>
                  <div className="p-6">
                    <Routes>
                      <Route path="/documents/:id" element={<Story />} />
                    </Routes>
                  </div>
                </MemoryRouter>
              </TaxonomyProvider>
            </DocumentsProvider>
          </AuthorizationProvider>
        </QueryClientProvider>
      </I18nextProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

/** Per-document detail view — header actions, tag/category strips, document summary, version timeline and shares dialog — for the NDA fixture, backed by the mock documents/versions/shares endpoints. */
export const Default: Story = {};
