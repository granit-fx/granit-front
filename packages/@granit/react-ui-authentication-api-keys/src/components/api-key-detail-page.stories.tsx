import { createApiClient } from '@granit/api-client';
import { GranitClientProvider } from '@granit/react-api-client';
import { createApiKeyHandlers, mockApiKeys } from '@granit/react-authentication-api-keys/testing';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter, Route, Routes } from 'react-router';

import { storyI18n } from '../stories-i18n';

import { ApiKeyDetailPage } from './api-key-detail-page';

import type { Meta, StoryObj } from '@storybook/react-vite';

const client = createApiClient({ baseURL: '' });
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

const activeKey = mockApiKeys[0]!;

const meta: Meta<typeof ApiKeyDetailPage> = {
  title: 'API Keys/ApiKeyDetailPage',
  component: ApiKeyDetailPage,
  tags: ['autodocs', '!test'],
  parameters: {
    layout: 'fullscreen',
    msw: { handlers: createApiKeyHandlers() },
  },
  decorators: [
    (Story) => (
      <I18nextProvider i18n={storyI18n}>
        <QueryClientProvider client={queryClient}>
          <GranitClientProvider client={client}>
            <MemoryRouter initialEntries={[`/api-keys/${activeKey.id}`]}>
              <Routes>
                <Route
                  path="/api-keys/:id"
                  element={
                    <div className="p-6">
                      <Story />
                    </div>
                  }
                />
              </Routes>
            </MemoryRouter>
          </GranitClientProvider>
        </QueryClientProvider>
      </I18nextProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

/** Detail view of an active key, with the scopes (permissions / CIDR) cards. */
export const Default: Story = {};
