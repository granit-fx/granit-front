import { createApiClient } from '@granit/api-client';
import { AuthorizationProvider } from '@granit/react-authorization';
import { DocumentsProvider } from '@granit/react-documents';
import { createDocumentsHandlers, DOC_NDA_ID } from '@granit/react-documents/testing';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { storyI18n } from '../stories-i18n';

import { DocumentPublicLinksPage } from './document-public-links-page';

import type { Meta, StoryObj } from '@storybook/react-vite';

const client = createApiClient({ baseURL: '' });
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

const meta: Meta<typeof DocumentPublicLinksPage> = {
  title: 'Documents/DocumentPublicLinksPage',
  component: DocumentPublicLinksPage,
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
              <MemoryRouter initialEntries={[`/documents/${DOC_NDA_ID}/public-links`]}>
                <div className="p-6">
                  <Routes>
                    <Route path="/documents/:id/public-links" element={<Story />} />
                  </Routes>
                </div>
              </MemoryRouter>
            </DocumentsProvider>
          </AuthorizationProvider>
        </QueryClientProvider>
      </I18nextProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

/** Public-link management (create / revoke) for the NDA fixture document, backed by the mock `/documents/{id}/public-links` endpoints. */
export const Default: Story = {};
