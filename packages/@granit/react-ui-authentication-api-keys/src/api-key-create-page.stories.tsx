import { createApiClient } from '@granit/api-client';
import { GranitClientProvider } from '@granit/react-api-client';
import { createApiKeyHandlers } from '@granit/react-authentication-api-keys/testing';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';

import { ApiKeyCreatePage } from './api-key-create-page';
import { storyI18n } from './stories-i18n';

import type { Meta, StoryObj } from '@storybook/react-vite';

const client = createApiClient({ baseURL: '' });
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

const meta: Meta<typeof ApiKeyCreatePage> = {
  title: 'API Keys/ApiKeyCreatePage',
  component: ApiKeyCreatePage,
  tags: ['autodocs', '!test'],
  parameters: {
    layout: 'padded',
    msw: { handlers: createApiKeyHandlers() },
  },
  decorators: [
    (Story) => (
      <I18nextProvider i18n={storyI18n}>
        <QueryClientProvider client={queryClient}>
          <GranitClientProvider client={client}>
            <MemoryRouter initialEntries={['/api-keys/new']}>
              <Story />
            </MemoryRouter>
          </GranitClientProvider>
        </QueryClientProvider>
      </I18nextProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

/** The spec-validated create form (constraints resolver from apiKeysConstraints). */
export const Default: Story = {};
