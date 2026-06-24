import { createApiClient } from '@granit/api-client';
import { AuthorizationProvider } from '@granit/react-authorization';
import { DocumentsProvider } from '@granit/react-documents';
import { createDocumentsHandlers } from '@granit/react-documents/testing';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';

import { DocumentsExplorerPage } from './documents-explorer-page';
import { storyI18n } from './stories-i18n';

import type { Meta, StoryObj } from '@storybook/react-vite';

const client = createApiClient({ baseURL: '' });
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

const meta: Meta<typeof DocumentsExplorerPage> = {
  title: 'Documents/DocumentsExplorerPage',
  component: DocumentsExplorerPage,
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
              <MemoryRouter initialEntries={['/documents']}>
                <div className="p-6">
                  <Story />
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

/** Full documents explorer — folder tree, list/grid, upload, inspector and quota badge — backed by the mock folders/documents/quota endpoints. */
export const Default: Story = {};
