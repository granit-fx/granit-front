import { createApiClient } from '@granit/api-client';
import { GranitClientProvider } from '@granit/react-api-client';
import { createApiKeyHandlers } from '@granit/react-authentication-api-keys/testing';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router';

import { storyI18n } from '../stories-i18n';

import { ApiKeyListPage } from './api-key-list-page';

import type { Meta, StoryObj } from '@storybook/react-vite';

const client = createApiClient({ baseURL: '' });
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

const meta: Meta<typeof ApiKeyListPage> = {
  title: 'API Keys/ApiKeyListPage',
  component: ApiKeyListPage,
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
            <MemoryRouter initialEntries={['/api-keys']}>
              <div className="p-6">
                <Story />
              </div>
            </MemoryRouter>
          </GranitClientProvider>
        </QueryClientProvider>
      </I18nextProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

/** The paginated, filterable list backed by the mock api-key handlers. */
export const Default: Story = {};
