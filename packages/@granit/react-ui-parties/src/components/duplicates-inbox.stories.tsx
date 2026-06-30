import { createApiClient } from '@granit/api-client';
import { PartiesProvider, partiesTranslationsEn } from '@granit/react-parties';
import { createPartiesHandlers } from '@granit/react-parties/testing';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import i18next from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import { fn } from 'storybook/test';

import { DuplicatesInbox } from './duplicates-inbox';

import type { Meta, StoryObj } from '@storybook/react-vite';

// `parties` namespace with the dot key-separator (nested `Duplicates.*` keys).
const partiesI18n = i18next.createInstance();
void partiesI18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  ns: ['parties'],
  defaultNS: 'parties',
  resources: { en: { parties: partiesTranslationsEn } },
  interpolation: { escapeValue: false },
  returnNull: false,
});

const client = createApiClient({ baseURL: '' });
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

const meta: Meta<typeof DuplicatesInbox> = {
  title: 'Features/Parties/DuplicatesInbox',
  component: DuplicatesInbox,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    msw: { handlers: createPartiesHandlers() },
  },
  args: { onMerge: fn(), partyDetailBasePath: '/parties' },
  decorators: [
    (Story) => (
      <I18nextProvider i18n={partiesI18n}>
        <QueryClientProvider client={queryClient}>
          <MemoryRouter>
            <PartiesProvider config={{ client, basePath: '/api/v1/parties' }}>
              <Story />
            </PartiesProvider>
          </MemoryRouter>
        </QueryClientProvider>
      </I18nextProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const ReadOnly: Story = {
  args: { onMerge: undefined },
};
