import { createApiClient } from '@granit/api-client';
import { PartiesProvider, partiesTranslationsEn } from '@granit/react-parties';
import { createPartiesHandlers, sampleParties } from '@granit/react-parties/testing';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import i18next from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';

import { MergeWizard } from './merge-wizard';

import type { Meta, StoryObj } from '@storybook/react-vite';

// The merge-wizard reads the `parties` namespace (nested `MergeWizard.*` keys
// owned by @granit/react-parties), so it needs an i18n instance with the dot
// key-separator enabled — distinct from the flat Storybook root instance.
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

const [survivor, loser] = sampleParties;

const meta: Meta<typeof MergeWizard> = {
  title: 'Features/Parties/MergeWizard',
  component: MergeWizard,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    msw: { handlers: createPartiesHandlers() },
  },
  decorators: [
    (Story) => (
      <I18nextProvider i18n={partiesI18n}>
        <QueryClientProvider client={queryClient}>
          <PartiesProvider config={{ client, basePath: '/api/v1/parties' }}>
            <Story />
          </PartiesProvider>
        </QueryClientProvider>
      </I18nextProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { survivorId: survivor!.id, loserId: loser!.id },
};
